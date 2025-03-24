# Following tutorial from https://www.digitalocean.com/community/tutorials/how-to-automate-jenkins-setup-with-docker-and-jenkins-configuration-as-code
# And this tutorial: https://plugins.jenkins.io/configuration-as-code/

FROM jenkins/jenkins:lts-jdk17

# Configure jenkins
ENV JAVA_OPTS -Djenkins.install.runSetupWizard=false

# Install jenkins plugins
COPY --chown=jenkins:jenkins plugins.txt /usr/share/jenkins/ref/plugins.txt
RUN jenkins-plugin-cli -f /usr/share/jenkins/ref/plugins.txt

# Copy configuration as code
COPY --chown=jenkins:jenkins ./config.yaml /jenkins/casc_configs/jenkins.yaml
ENV CASC_JENKINS_CONFIG=/jenkins/casc_configs

EXPOSE 8080