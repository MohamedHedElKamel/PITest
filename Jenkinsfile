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

        // ───────── FIX NODE DEPENDENCIES ─────────
        stage('Install System Dependencies') {
            steps {
                sh 'apt-get update && apt-get install -y libatomic1'
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
