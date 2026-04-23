pipeline {
    agent any

    tools {
        jdk '17'
        nodejs 'node20'
    }

    stages {

        // ───────── CHECKOUT ─────────
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        // ───────── BACKEND ─────────
        stage('Backend - Build') {
            steps {
                dir('backend/FoncGreffon') {
                    sh 'mvn clean compile'
                }
            }
        }

        stage('Backend - Tests') {
            steps {
                dir('backend/FoncGreffon') {
                    sh 'mvn test'
                }
            }
        }

        // ───────── FRONTEND ─────────
        stage('Frontend - Install Dependencies') {
            steps {
                dir('frontend/mon-projetLastestVer') {
                    sh 'npm install'
                }
            }
        }

        stage('Frontend - Tests') {
            steps {
                dir('frontend/mon-projetLastestVer') {
                    sh 'npm run test -- --watch=false'
                }
            }
        }

        stage('Frontend - Build') {
            steps {
                dir('frontend/mon-projetLastestVer') {
                    sh 'npm run build -- --configuration production'
                }
            }
        }
    }
}
