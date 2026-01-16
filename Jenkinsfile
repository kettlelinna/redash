pipeline {
    agent any

    stages {
        stage('Build Docker Image') {
            steps {
                container('docker') {
                    sh '''
                        docker images
                    '''
                }
            }
        }

        stage('Clone Code') {
            steps {
                echo "Hello"
            }
        }
    }
}
