Static MobX Routing Example Project
===================================

This project is an example of a statically typed and more controllable approach
to routing web-based client-side apps by leveraging MobX and TypeScript. I tried
to make this example sufficiently complex such that more interesting routing
scenarious can be examined. Play with the [live instance][live-instance].

Note, I do not claim that this approach is perfect. I am very much open to
suggestions and discussions—one of the main reasons I created it in the first
place. Nonetheless, I have been quite happy with this approach so far.

  [live-instance]: http://static-mobx-routing.surge.sh


Run Instructions
----------------

Simply run `npm install` and later `npm start`. For yarn it's `yarn install` and
`yarn start`. Go to `http://localhost:5001/` to see the app.

Even though this projects mimics a client-side app that communicates with a
remote backend, there is no need run a local server. The reason is that this
project contains an embedded mock server implementation. State is not persisted
across reloads of the app.


Advantages
----------

The following are the advantages of this routing and project structuring approach:

- Type system and tooling support
- UI is *completely* derived from state
    - More control over routing and its interaction with other state (such as caches)
    - Simpler data flow (e.g. app state changes transparently lead to route changes)
- No need for third-party routing library

Please read [“How to Decouple State and UI”][mobx-article] for background
information.
  

Motivation
----------

I have never been satisfied with routing in client-side apps. When I was writing
Android apps the conventional code needed to change from one conceptual screen
to another (*routing code*) seemed unnecessarily convoluted. Don't get me
started on this whole Fragment/Activity fiasco. Eventually, I found an approach
to routing code with which I was satisfied and that actually was statically typed
(a shoutout to [Conductor][conductor] as it made things way better even though
it was not *strictly* necessary).

When I started writing React apps the consensus was to use [React
Router][react-router]. Even with its version 3, routing code felt complicated
and limiting compared to the approach I have employed in my Android code. At
some point, I started using [MobX][mobx] for state management and change
propagation which, by the way, is all that I wished for after I have written my
[master's thesis on GUI Programming][7guis]. Although the non-routing code
became much better with MobX there was still something off about the routing
code. By chance, I read the *terrific* article [“How to Decouple State and
UI”][mobx-article] by MobX's author Michel Weststrate which was eye-opening to
say the least. In conventional React routing code URL changes do not directly
change app state but first lead to mounting components which then change the app
state themselves. This goes against the paradigm of deriving the UI completely
from the app state and has several negative consequences. Based on this article
I even created a [presentation][presentation] ([slides][presentation-slides]).

Despite the benefits of the MobX-based routing code approach presented in the
article there were still two things that bothered me about it and that were
better in my previous Android approach. Namely, the static type system was not
leveraged and code that felt should be close together (as you would most of the
time change it simultaneously) was separated. In order to see if I could improve
upon these points and also to test if that approach works in more complicated
scenarios, I created this project.

Hopefully, this project leads to discussions and new insights. Maybe you see
potentials for improving the approach which I'd like to hear about. Maybe you
disagree with this approach and in that case I would be very interested in
arguments against it.

  [conductor]: https://github.com/bluelinelabs/Conductor
  [react-router]: https://github.com/ReactTraining/react-router
  [mobx]: https://mobx.js.org/
  [7guis]: https://github.com/eugenkiss/7guis
  [mobx-article]: https://medium.com/@mweststrate/how-to-decouple-state-and-ui-a-k-a-you-dont-need-componentwillmount-cc90b787aa37
  [presentation]: https://github.com/techbo1/react-mobx-intro-tu-berlin
  [presentation-slides]: https://www.slideshare.net/secret/LEzjdIFLT90IVt


Overview
--------

As described in the Motivation section, I essentially set out to create a
“sufficiently” complicated example that takes the spirit of the [“How to
Decouple State and UI”][mobx-article] article and improves it by leveraging
static type information and restructuring routing code so that things that
should be close together are in fact close together. To be specific, I created
dedicated classes for routes. Other features, to achieve the goal of ”sufficient
complicatedness”, include:

- Fast screen transitions
- Embedded mock server with adjustable parameters (delay, variance, error rate)
- Skeleton loading and handling loading states in general
- Client-side caching
- Login/logout handling
- Handling error cases (e.g. failed request)
- Handling race conditions
- Prevention of screen transitions
- Handling query parameters
- History (de)serialization
- Scroll position restoration
- Form handling
- Animations

You can have a look at the [live instance][live-instance] and play around with the
app. Make sure to adjust the mock server parameters to see the handling of error
cases. Try going back and forth in the history with different scroll positions.
Note history manipulations where, for example, an new post route entry is replaced
with the resulting post route after successful saving. Try changing the search query
paramter and note that there will never be two successive search routes in the history.
Try to increase the delay and variance to their max values and quickly click on a post
then go back and click on another post and repeat. If you do that for a while and you
open the developer console you should see whenever a race condition was prevented.
If not clear, it is of course not a real application but more of a demo so that not
much effort has been put into its visual design.

The most relevant files with respect to routing code are `store.tsx`, `router.tsx` and
`history.tsx`. The entry point is `index.tsx`.

For simplicity (and for other reasons) I do not employ dependency injection for the
store and other things.

A shoutout to the following great (but arguably lesser known) projects that I
used to great effect in this one:

- [styled components](https://styled-components.com/).
  As React has been the “revelation” for client-side apps in general, so is
  styled components when it comes to an app's styling concerns.
- [FromState](https://formstate.github.io/).
  Forms have been a pain point in React code since its inceptions. FormState
  seems to me one of the best approaches from playing around with it and
  comparing it to others.

If you see something that can be improved, please let me know (GitHub Issue)!


Open Problems
-------------

I am not happy with some parts of this project so I'm going to list them here.

The main thing I really don't like is my history and scroll restoration
implementation. It seems quite complicated and complex as well as not as
decoupled as I think it could be. For practical uses, scroll restoration should
be more customizable as well. Plus, it's kind of buggy.

The `@action` annotation is not really doing what it is supposed to do. The
reason is the transformation that TypeScript applies to async functions (see
<https://mobx.js.org/refguide/action.html>). Something like
<https://github.com/mobxjs/babel-plugin-mobx-deep-action> but directly for
TypeScript would be great. Afaik, TypeScript will soon allow such plugins.

In Android and Java land there is [Retrofit](https://square.github.io/retrofit/)
which I find to be a very good HTTP client library. In this project I essentially
created my own ad-hoc one based on `fetch`. It works fine, however a TypeScript
version of Retrofit would benefit the community I think.

Some other questions in my mind are:

- Has the `go` or rather screen transition prevention approach I use in `store.tsx`
  any downsides?
- Has the approach to state transitions of buttons depending on requests states downsides?
- Is there a better approach here to handle caching and race conditions? Has
  this `RequestState` approach downsides. MobX-Utils's `fromPromise` could be used
  as well and could also be used to handle race conditions. Would it be better (I
  did not really try as I think it would not)?
- What are arguments for using MobX-Utils's `createViewModel` for `Post` instead
  of the current approach?
- Should MobX provide debounced computed properties (see `search.tsx`)?


Misc
----

Why is this project not a library? The short answer is that if I knew how to
make a library out of it then I would have. Nonetheless, I think the pattern is
the important thing here and it can be specialized for your app. As routing is
often such an integral part of apps it seems justifiable to take full control
over it.

The generated text is inspired by [“Escape from New York”](http://www.imdb.com/title/tt0082340/) ;).


Related Projects
----------------

As mentioned already several times, the main inspiration is the article
[“How to Decouple State and UI”][mobx-article].

[MobX Router][mobx-router] is another great project which is similarly inspired
by the aforementioned article but takes a slightly different aproach.

  [mobx-router]: https://github.com/kitze/mobx-router
