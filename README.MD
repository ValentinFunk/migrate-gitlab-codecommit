This script can be used to migrate from GitLab to AWS Code Commit.
It moves all repositories from GitLab to CodeCommit. It assumes you have already configured the system to work with codecommit.

## Usage

1.) Set up environment variables:
- Either use ~/.aws/credentials or set up AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY (more about access keys: http://docs.aws.amazon.com/console/iam/access-keys)
- If using windows:Set AWS_KEY_ID to your SSH Key ID (Get from AWS Console -> IAM > Users > (YOur User) > Security Credentials)
- Set GITLAB_URL to your gitlab's URL, GITLAB_TOKEN to your gitlab API token (get from <Your Gitlab>/profile/account)

2.) Run the script
Run without arguments to migrate all repositories. List repository names witout namespace for selective migration.

    node index.js # All repositories
    node index.js repo1 repo2 repo3 # Migrate only repo1, repo2, repo3
