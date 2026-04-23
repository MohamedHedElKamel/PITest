pipeline {
    agent any

    tools {
        maven 'maven3'
        jdk '17'
        nodejs 'node20'
    }

    stages {

        // ───────── BACKEND BUILD ─────────
        stage('Backend - Build') {
            steps {
                dir('backend/FoncGreffon') {
                    sh 'mvn clean compile'
                }
            }
        }

        // ───────── BACKEND TESTS ─────────
        stage('Backend - Tests') {
            steps {
                dir('backend/FoncGreffon') {
                    sh 'mvn test'
                }
            }
        }

        // ───────── FRONTEND INSTALL ─────────
        stage('Frontend - Install Dependencies') {
            steps {
                dir('frontend/mon-projetLastestVer') {
                    sh 'npm install'
                }
            }
        }

        // ───────── FRONTEND TESTS ─────────
        stage('Frontend - Tests') {
            steps {
                dir('frontend/mon-projetLastestVer') {
                    sh 'npm run test -- --watch=false'
                }
            }
        }

        // ───────── FRONTEND BUILD ─────────
        stage('Frontend - Build') {
            steps {
                dir('frontend/mon-projetLastestVer') {
                    sh 'npm run build -- --configuration production'
                }
            }
        }
    }
}
