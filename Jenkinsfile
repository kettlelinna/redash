pipeline {
    agent {
        label 'node1'
    }

    stages {
        stage('Build Docker Image') {
            steps {
                sh "docker build -t myredash:0.0.1 -f ./Dockerfile ."
            }
        }
    }
}
