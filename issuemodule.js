const { Octokit } = require('@octokit/rest');

class GitHubIssueCreator {
  constructor(token) {
    this.octokit = new Octokit({
      auth: token,
    });
  }

  async createIssue(owner, repo, title, body, labels = []) {
    try {
      const response = await this.octokit.issues.create({
        owner,
        repo,
        title,
        body,
        labels,
      });
      // console.log('Issue created successfully:', response.data);
      return response.data;
    } catch (error) {
      if (error.status === 401) {
        console.error('Unauthorized: Invalid or missing credentials');
      } else {
        console.error('Error creating issue:', error.message);
      }
      throw error;
    }
  }
}

module.exports = GitHubIssueCreator;
