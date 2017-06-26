pipeline {
    agent any
    environment { 
        FLYNN_APP = 'relisten-sonos'
        AG_SUBDOMAIN = 'relistensonos'
    }
    stages {
        stage('Build') {
            steps {
                sh '''set -x
                    flynn create --remote \'\' $FLYNN_APP || true
                    docker build -t flynn-$FLYNN_APP .
                '''
            }
        }
        stage('Deploy') {
            when {
                expression {
                    currentBuild.result == null || currentBuild.result == 'SUCCESS' 
                }
            }
            steps {
                sh '''set -x
                    flynn -a $FLYNN_APP docker push flynn-$FLYNN_APP
                    echo "Updating SSL certs..."
                    flynn -a $FLYNN_APP route add http $AG_SUBDOMAIN.alecgorge.com || true
                    flynn -a $FLYNN_APP route | grep \\:[^.]*\\.alecgorge\\.com | cut -f2 | awk \'{ print $3; }\' | xargs -I % flynn -a $FLYNN_APP route update % -c /home/alecgorge/tls/server.crt -k /home/alecgorge/tls/server.key
                    flynn -a $FLYNN_APP scale app=1
                '''

                retry(3) {
                    sh '''set -x
                    sleep 5
                    curl -f "http://$AG_SUBDOMAIN.aberforth.alecgorge.com/"
                    curl -f "https://$AG_SUBDOMAIN.alecgorge.com/"
                    '''
                }
            }
        }
    }
}