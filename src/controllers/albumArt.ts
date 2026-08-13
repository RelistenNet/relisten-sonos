import { Canvas, createCanvas, registerFont } from 'canvas';
import express, { Response, Router } from 'express';
import { drawRelistenAlbumArt, makeRect } from '../lib/albumArt.js';
import winston from '../logger.js';
import { getShow, getShowByUuid } from '../relisten/api.js';
import { getArtistName } from '../relisten/artists.js';
import type { Show, Source, Venue } from '../relisten/types.js';

const router: Router = express.Router();

registerFont(import.meta.dirname + '/../../fonts/Inter-Bold.ttf', {
  family: 'Inter',
  weight: 'bold',
});

const UNKNOWN_VENUE: Venue = {
  name: 'Unknown Venue',
  location: 'Unknown Location',
};

// Catch clauses hand us `unknown`; log the message when there is one.
const errorMessage = (error: unknown): unknown => (error instanceof Error ? error.message : error);

const parseSize = (raw: string | undefined): number | null => {
  const size = parseInt(raw || '500', 10);

  if (isNaN(size) || !(size > 0 && size <= 1500)) return null;

  return size;
};

// Prioritize the show venue, then the source venue.
const resolveVenue = (show: Show, source: Source): Venue => {
  if (show.venue) return show.venue;
  if (source.venue) return source.venue;

  return UNKNOWN_VENUE;
};

// Both routes do the same thing once they have a show + source: draw the art
// and stream a PNG back. They only differ in how they look the show up.
const renderAlbumArt = async (
  res: Response,
  size: number,
  artistName: string,
  { show, source, logContext }: { show: Show; source: Source; logContext: object }
): Promise<void> => {
  const venue = resolveVenue(show, source);

  const canvas: Canvas = createCanvas(size, size);

  drawRelistenAlbumArt(
    canvas,
    {
      artist: artistName,
      showDate: show.display_date,
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
        winston.error('Failed to create PNG buffer', { error: err, ...logContext });
        return res.status(500).send('Error generating image buffer');
      }
      return res.send(buf);
    },
    'image/png',
    { compressionLevel: 3 }
  );
};

router.get('/', (req, res) => {
  res.json({ hi: 'hi world' });
});

router.get(
  '/album-art/:artist/years/:year/:show_date/{:source}/:size.png',
  async (req, res): Promise<Response | void> => {
    const size = parseSize(req.params['size']);

    if (size === null) return res.status(400).send('Invalid size parameter');

    const slug: string = req.params['artist'];
    const year: string = req.params['year'];
    const date: string = req.params['show_date'];
    const sourceId: string | undefined = req.params['source']; // source is optional

    const logContext = { slug, year, date, sourceId };

    try {
      const artistName = await getArtistName(slug);
      const show = await getShow(slug, year, date);

      if (!show || !show.sources || show.sources.length === 0) {
        winston.error('no json sources found (v2 api)', logContext);
        return res.status(404).send('Show or sources not found');
      }

      // Find source by ID if provided, otherwise use the first source
      const source = sourceId
        ? show.sources.find((s) => `${s.id}` === sourceId || s.uuid === sourceId)
        : show.sources[0];

      if (!source || !source.sets) {
        winston.error('no matching source found or source has no sets (v2 api)', logContext);
        return res.status(404).send('Source not found or invalid');
      }

      return await renderAlbumArt(res, size, artistName, { show, source, logContext });
    } catch (error) {
      winston.error('Error fetching or processing show data (v2 api)', {
        error: errorMessage(error),
        ...logContext,
      });
      // Avoid sending detailed error messages to the client
      return res.status(500).send('Error fetching show data');
    }
  }
);

router.get(
  '/ios-album-art/:artist/:source_uuid/:size.png',
  async (req, res): Promise<Response | void> => {
    // Note: source_uuid is mandatory based on the path
    const size = parseSize(req.params['size']);

    if (size === null) return res.status(400).send('Invalid size parameter');

    const artistParam: string = req.params['artist']; // This might be slug or name, clarify usage
    const sourceUuid: string = req.params['source_uuid'];

    const logContext = { artistParam, sourceUuid };

    // Using v3 API endpoint: the response is the show containing the source.
    try {
      const show = await getShowByUuid(sourceUuid);

      if (!show || !show.sources || show.sources.length === 0) {
        winston.error('no json sources found (v3 api)', { sourceUuid });
        return res.status(404).send('Show or sources not found');
      }

      const source = show.sources.find((s) => s.uuid === sourceUuid) || show.sources[0];

      if (!source || !source.sets) {
        winston.error('no matching source found or source has no sets (v3 api)', logContext);
        return res.status(404).send('Source not found or invalid');
      }

      // Using the artist param directly, might need lookup if it's a slug
      return await renderAlbumArt(res, size, artistParam, { show, source, logContext });
    } catch (error) {
      winston.error('Error fetching or processing show data (v3 api)', {
        error: errorMessage(error),
        ...logContext,
      });
      return res.status(500).send('Error fetching show data');
    }
  }
);

export default router;
