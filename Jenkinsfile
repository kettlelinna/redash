pipeline {
    agent any

    stages {
        stage('Build Docker Image') {
            steps {
                    sh '''
                        docker images
                    '''
            }
        }

        stage('Clone Code') {
            steps {
                echo "Hello"
            }
        }
    }
}
