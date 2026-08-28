pipeline {
    agent any

    // ---- Configure these per environment ----
    environment {
        SONAR_HOST_URL   = 'http://localhost:9000/'
        SONAR_TOKEN      = credentials('118e514b2ba4979fe9aa2db4b63d7c58f7')      // Jenkins credential ID
        SONAR_PROJECT_KEY = "k6"
        REPORT_DIR       = 'security-reports'
    }

    options {
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Prepare Report Dir') {
            steps {
                sh 'rm -rf ${REPORT_DIR} && mkdir -p ${REPORT_DIR}'
            }
        }

        // ---------------- SEMGREP (SAST) ----------------
        stage('Semgrep Scan') {
            steps {
                sh '''
                    pip install --break-system-packages --quiet semgrep || true
                    semgrep --config=auto --json \
                        --output=${REPORT_DIR}/semgrep-report.json . || true
                '''
            }
        }

        // ---------------- TRIVY (deps / IaC / container) ----------------
        stage('Trivy Scan') {
            steps {
                sh '''
                    # Filesystem scan - works for any repo regardless of language
                    trivy fs --scanners vuln,secret,misconfig \
                        --format json \
                        --output ${REPORT_DIR}/trivy-report.json . || true

                    # Optional: if you build a Docker image in an earlier stage,
                    # also scan the image itself:
                    # trivy image --format json --output ${REPORT_DIR}/trivy-image-report.json myapp:${BUILD_NUMBER} || true
                '''
            }
        }

        // ---------------- SONARQUBE (code quality + security) ----------------
        stage('SonarQube Scan') {
            steps {
                withSonarQubeEnv('SonarQubeServer') {   // name configured in Jenkins > Manage Jenkins > System
                    sh '''
                        sonar-scanner \
                          -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                          -Dsonar.sources=. \
                          -Dsonar.host.url=${SONAR_HOST_URL} \
                          -Dsonar.login=${SONAR_TOKEN}
                    '''
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: false
                }
            }
        }

        stage('Fetch SonarQube Issues (JSON)') {
            steps {
                sh '''
                    curl -s -u ${SONAR_TOKEN}: \
                      "${SONAR_HOST_URL}/api/issues/search?componentKeys=${SONAR_PROJECT_KEY}&ps=500" \
                      -o ${REPORT_DIR}/sonarqube-report.json
                '''
            }
        }

        // ---------------- CONSOLIDATED PDF ----------------
        stage('Generate PDF Report') {
            steps {
                sh '''
                    pip install --break-system-packages --quiet fpdf2 || true
                    python3 generate_report.py ${REPORT_DIR}
                '''
            }
        }

        stage('Archive Reports') {
            steps {
                archiveArtifacts artifacts: "${REPORT_DIR}/*", fingerprint: true
            }
        }
    }

    post {
        always {
            echo "Security scan pipeline finished. See archived artifacts for JSON + PDF reports."
        }
        failure {
            echo "Pipeline failed — check stage logs above."
        }
    }
}
