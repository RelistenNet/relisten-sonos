import { Canvas, createCanvas, registerFont } from 'canvas';
import express, { Router } from 'express';
import { drawRelistenAlbumArt, makeRect } from '../lib/albumArt'; // Assuming these are named exports
import artistsCache from '../lib/artistsCache'; // Assuming default export
import winston from '../logger';

// Define interfaces for better type safety (can be refined or moved)
interface Venue {
  name: string;
  location: string;
}

interface Source {
  id?: string | number;
  uuid?: string;
  sets: any[]; // Define Set/Track types if needed
  venue?: Venue;
}

interface ShowApiResponse {
  display_date: string;
  venue?: Venue;
  sources: Source[];
}

interface ArtistInfo {
  name: string;
  // Add other properties if available in artistsCache
}

interface ArtistsCacheType {
  [key: string]: ArtistInfo;
}

// Type assertion for artistsCache if its type isn't explicitly defined/exported
const typedArtistsCache = artistsCache as ArtistsCacheType;

const router: Router = express.Router();

const API_ROOT = 'https://api.relisten.net/api/v2';

// registerFont(__dirname + '/../../fonts/Roboto-Bold.ttf', { family: 'Roboto Bold' });
registerFont(__dirname + '/../../fonts/Roboto-Black.ttf', { family: 'RobotoBlack' });

router.get('/', (req, res) => {
  return res.json({ hi: 'hi world' });
});

router.get('/album-art/:artist/years/:year/:show_date/{:source}/:size.png', (req, res) => {
  const size = parseInt(req.params['size'] || '500', 10); // Provide default or handle NaN

  if (isNaN(size) || !(size > 0 && size <= 1500)) {
    return res.status(400).send('Invalid size parameter');
  }

  const canvas: Canvas = createCanvas(size, size);

  const slug: string = req.params['artist'];
  const artist: ArtistInfo | undefined = typedArtistsCache[slug];
  const artistName: string = artist ? artist.name : '';

  const year: string = req.params['year'];
  const date: string = req.params['show_date'];
  const sourceId: string | undefined = req.params['source']; // source is optional

  fetch(`${API_ROOT}/artists/${slug}/years/${year}/${date}`)
    .then((apiRes) => {
      if (!apiRes.ok) {
        throw new Error(`API request failed with status ${apiRes.status}`);
      }
      return apiRes.json();
    })
    .then((json: ShowApiResponse) => {
      if (!json || !json.sources || json.sources.length === 0) {
        winston.error('no json sources found (v2 api)', { slug, year, date, sourceId });
        return res.status(404).send('Show or sources not found');
      }

      // Find source by ID if provided, otherwise use the first source
      const source: Source | undefined = sourceId
        ? json.sources.find((s) => `${s.id}` === sourceId || s.uuid === sourceId)
        : json.sources[0];

      if (!source || !source.sets) {
        winston.error('no matching source found or source has no sets (v2 api)', {
          slug,
          year,
          date,
          sourceId,
        });
        return res.status(404).send('Source not found or invalid');
      }

      let venue: Venue = {
        name: 'Unknown Venue',
        location: 'Unknown Location',
      };

      // Prioritize show venue, then source venue
      if (json.venue) {
        venue = json.venue;
      } else if (source.venue) {
        venue = source.venue;
      }

      // Assuming drawRelistenAlbumArt and makeRect types are correctly inferred or defined elsewhere
      drawRelistenAlbumArt(
        canvas,
        {
          artist: artistName,
          showDate: json.display_date,
          venue: venue.name,
          location: venue.location,
        },
        makeRect(0, 0, size, size),
        'aspectfill'
      );

      res.type('png');

      // PNG Buffer, zlib compression level 3 (from 0-9): faster but bigger
      // Use async version for potentially long operations
      canvas.toBuffer(
        (err, buf) => {
          if (err) {
            winston.error('Failed to create PNG buffer', {
              error: err,
              slug,
              year,
              date,
              sourceId,
            });
            return res.status(500).send('Error generating image buffer');
          }
          res.send(buf);
        },
        'image/png',
        { compressionLevel: 3, filters: canvas.PNG_FILTER_NONE }
      );
    })
    .catch((error: any) => {
      winston.error('Error fetching or processing show data (v2 api)', {
        error: error.message || error,
        slug,
        year,
        date,
        sourceId,
      });
      // Avoid sending detailed error messages to the client
      res.status(500).send('Error fetching show data');
    });
});

router.get('/ios-album-art/:artist/:source_uuid/:size.png', (req, res) => {
  // Note: source_uuid is now mandatory based on the path, removed '?'
  const size = parseInt(req.params['size'] || '500', 10); // Provide default or handle NaN

  if (isNaN(size) || !(size > 0 && size <= 1500)) {
    return res.status(400).send('Invalid size parameter');
  }

  const canvas: Canvas = createCanvas(size, size);

  const artistParam: string = req.params['artist']; // This might be slug or name, clarify usage
  const sourceUuid: string = req.params['source_uuid'];

  // Using v3 API endpoint as in the original code
  fetch(`https://api.relisten.net/api/v3/shows/${sourceUuid}`)
    .then((apiRes) => {
      if (!apiRes.ok) {
        throw new Error(`API request failed with status ${apiRes.status}`);
      }
      return apiRes.json();
    })
    .then((json: ShowApiResponse) => {
      // Assuming v3 response structure is similar enough
      // V3 show endpoint returns a single show, sources are within it.
      if (!json || !json.sources || json.sources.length === 0) {
        winston.error('no json sources found (v3 api)', { sourceUuid });
        return res.status(404).send('Show or sources not found');
      }

      // In v3 /shows/{uuid}, the response is the show containing the source.
      // We might still want to find the specific source if multiple exist, though unlikely for this endpoint.
      const source: Source | undefined =
        json.sources.find((s) => s.uuid === sourceUuid) || json.sources[0];

      if (!source || !source.sets) {
        // Use relevant variables for logging
        winston.error('no matching source found or source has no sets (v3 api)', {
          artistParam,
          sourceUuid,
        });
        return res.status(404).send('Source not found or invalid');
      }

      let venue: Venue = {
        name: 'Unknown Venue',
        location: 'Unknown Location',
      };

      // Prioritize show venue, then source venue (if available on source in v3)
      if (json.venue) {
        venue = json.venue;
      } else if (source.venue) {
        // Check if source.venue exists in v3 API response
        venue = source.venue;
      }

      // Assuming drawRelistenAlbumArt and makeRect types are correctly inferred or defined elsewhere
      drawRelistenAlbumArt(
        canvas,
        {
          artist: artistParam, // Using the artist param directly, might need lookup if it's a slug
          showDate: json.display_date,
          venue: venue.name,
          location: venue.location,
        },
        makeRect(0, 0, size, size),
        'aspectfill'
      );

      res.type('png');

      // PNG Buffer, zlib compression level 3 (from 0-9): faster but bigger
      // Use async version
      canvas.toBuffer(
        (err, buf) => {
          if (err) {
            winston.error('Failed to create PNG buffer', { error: err, artistParam, sourceUuid });
            return res.status(500).send('Error generating image buffer');
          }
          res.send(buf);
        },
        'image/png',
        { compressionLevel: 3, filters: canvas.PNG_FILTER_NONE }
      );
    })
    .catch((error: any) => {
      winston.error('Error fetching or processing show data (v3 api)', {
        error: error.message || error,
        artistParam,
        sourceUuid,
      });
      res.status(500).send('Error fetching show data');
    });
});

export default router; // Use ES6 export default
