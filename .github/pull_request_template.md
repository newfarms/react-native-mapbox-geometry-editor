I'd like to merge my review branch into its feature branch.

This pull request is related to the following task IDs on ProofHub: e.g., #44, #193, #12.
When merging a full code review pull request, please make sure you change the state of the above tasks to *Done*.

## Summary of changes

Please provide a summary of your changes that you think the reviewers must know about. This could be the name of the
name of the files you added, name of the functions/classes you added. Also, try to be a little descriptive and do
not use sentences like *I added a new file to the documents folder!*

1. I added two new methods `method1` and `method2` to the `Class` class in the `source.py` file. These enable the user
to:
    1. Create new threads when creating a new instance of `Class` and starting it and also will not block the main thread.
1. Another item goes here...

## Any tips to help running or testing the new changes

In here, briefly describe how the reviewer could run your code/changes or how they can test and evaluate your changes.
Again, try to be descriptive and help the reviewers do their job better and faster! Therefore, a list of the things
that you would like the reviewers to look into, must go here.

1. To test and see if `method1` works as expected, first try to create an instance of `Class` and then run the source
file `main.py`. Wait for a few seconds and see if `method1` will block the main thread in `main.py`.
2. Another item goes here...

## Notes

The following items could fit in this section:

1. Anything else you would like to add goes here. For example, if something is broken and the team is aware of it and it does not have to be tested as part of this pull request,
2. If there is anything in your mind that you think might cause a problem for reviewers,
3. If you have something in mind that you haven't added to the repository yet and you think might be beneficial for the reviewers to know about,
4. And any similar situation...

Thanks for reviewing and helping the team to improve quality of their work with your feedback.
