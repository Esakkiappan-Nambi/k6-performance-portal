pipeline {
    agent any

    environment {
        SONAR_HOST_URL    = 'http://localhost:9000'
        SONAR_PROJECT_KEY = 'k6'
        REPORT_DIR        = 'security-reports'
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
                sh '''
                    rm -rf "${REPORT_DIR}"
                    mkdir -p "${REPORT_DIR}"
                '''
            }
        }

        stage('Check Tools') {
            steps {
                sh '''
                    echo "Checking required tools..."

                    git --version || true
                    python3 --version || true
                    pip --version || true
                    sonar-scanner --version || true
                    trivy --version || true
                    semgrep --version || true

                    echo "Workspace:"
                    pwd
                    ls -la
                '''
            }
        }

        stage('Semgrep Scan') {
            steps {
                sh '''
                    echo "Starting Semgrep scan..."

                    pip install --break-system-packages --quiet semgrep || true

                    semgrep \
                        --config=auto \
                        --json \
                        --output="${REPORT_DIR}/semgrep-report.json" \
                        . || true
                '''
            }
        }

        stage('Trivy Scan') {
            steps {
                sh '''
                    echo "Starting Trivy scan..."

                    trivy fs \
                        --scanners vuln,secret,misconfig \
                        --format json \
                        --output "${REPORT_DIR}/trivy-report.json" \
                        . || true
                '''
            }
        }

        stage('SonarQube Scan') {
            steps {
                withCredentials([
                    string(
                        credentialsId: 'squ_fdf6f82fbbc93b264907ffe614e633f4cde47559',
                        variable: 'SONAR_TOKEN'
                    )
                ]) {
                    withSonarQubeEnv('SonarQubeServer') {
                        sh '''
                            echo "Starting SonarQube scan..."

                            sonar-scanner \
                                -Dsonar.projectKey="${SONAR_PROJECT_KEY}" \
                                -Dsonar.sources=. \
                                -Dsonar.host.url="${SONAR_HOST_URL}" \
                                -Dsonar.token="${SONAR_TOKEN}"
                        '''
                    }
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

        stage('Fetch SonarQube Issues') {
            steps {
                withCredentials([
                    string(
                        credentialsId: '118e514b2ba4979fe9aa2db4b63d7c58f7',
                        variable: 'SONAR_TOKEN'
                    )
                ]) {
                    sh '''
                        echo "Fetching SonarQube issues..."

                        curl --fail --silent --show-error \
                            -u "${SONAR_TOKEN}:" \
                            "${SONAR_HOST_URL}/api/issues/search?componentKeys=${SONAR_PROJECT_KEY}&ps=500" \
                            -o "${REPORT_DIR}/sonarqube-report.json"
                    '''
                }
            }
        }

        stage('Generate PDF Report') {
            steps {
                sh '''
                    echo "Generating PDF report..."

                    pip install --break-system-packages --quiet fpdf2 || true

                    python3 generate_report.py "${REPORT_DIR}"
                '''
            }
        }

        stage('Archive Reports') {
            steps {
                archiveArtifacts(
                    artifacts: "${REPORT_DIR}/*",
                    fingerprint: true,
                    allowEmptyArchive: true
                )
            }
        }
    }

    post {
        always {
            echo 'Security scan pipeline finished. See archived artifacts for JSON + PDF reports.'
        }

        success {
            echo 'Pipeline completed successfully.'
        }

        failure {
            echo 'Pipeline failed — check the stage logs above.'
        }
    }
}
