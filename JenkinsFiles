pipeline {
    agent any

    triggers {
        triggerOnPush: true,
        triggerOnMergeRequest: true,
        branchFilterType: 'All'
    }

    stages {
        stage('Clone Code') {
            steps {
                echo "Hello"
            }
        }
    }
}
