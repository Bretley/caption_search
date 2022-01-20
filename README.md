# Caption Search

Not all of the code is here or public right now, but the real fun behind this one was building a miniature reverse index search.

### Why, you might ask?

A Youtuber that I enjoy a lot is notorious for using titles that don't lend themselves to easy searching. I might remember
a certain topic of conversation that was said, but not which of his ~1000 videos it was in. So instead of scratching my head,
I used youtube-dl to scrape the captions, then I used some backend code to create a reverse index from the captions. The major
challenge was figuring out how much compression I could get away with to reduce the bundle size
