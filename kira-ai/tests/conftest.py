import os

# Set test environment variables before any tests or application modules are imported
os.environ["KIRA_AI_API_KEY"] = "test-kira-ci-key-abc123"
os.environ["KIRA_AI_API_TOKEN"] = "test-kira-ci-key-abc123"
os.environ["API_KEY"] = "test-kira-ci-key-abc123"
os.environ["GEMINI_API_KEY"] = ""
os.environ["GITLAB_TOKEN"] = ""
os.environ["GITLAB_PROJECT_ID"] = ""
