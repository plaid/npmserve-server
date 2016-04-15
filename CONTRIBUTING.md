# Contributing

1.  Make one or more atomic commits, and ensure that each commit has a
    descriptive commit message. Commit messages should be line wrapped
    at 72 characters.

2.  Run `make test lint`, and address any errors. Preferably, fix commits
    in place using `git rebase` or `git commit --amend` to make the changes
    easier to review.

3.  Run the end-to-end server tests and make sure they pass.

    ```
    make test-endtoend
    ```

4.  Open a pull request.
