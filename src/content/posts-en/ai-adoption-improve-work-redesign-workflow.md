---
title: "Adopting AI: From Improving Existing Tasks to Rethinking How We Work"
description: "After building an HR knowledge assistant and a GenBI assistant, I started wondering: what happens after finding information gets faster? A reflection on review bottlenecks, business process reengineering, and how people and agents divide the work."
date: 2026-10-28
authors: ["Luke Kong"]
categories: ["AI"]
tags:
  [
    "Work Reflections",
    "AI Applications",
    "Workflows",
    "Business Process Reengineering",
  ]
audience: "non-technical"
image: "/images/post/ai-adoption-workflow-redesign-cover-en.png"
draft: false
---

## I Built an HR Knowledge Assistant and a GenBI Assistant. What Comes Next?

I've built quite a few AI agents and workflows, including an HR knowledge assistant and a GenBI assistant.

The HR knowledge assistant uses RAG to find information in HR documents and answer questions. The GenBI assistant uses Text2SQL so people who don't write SQL can query data themselves, using everyday language.

The goal is straightforward: spend less time looking things up and doing repetitive work. But as I worked on these assistants, I started wondering what happens after someone gets the information.

With GenBI, someone might use the results to prepare a report for their manager. They might also keep asking questions and explore the data further. The first use helps them finish an existing task faster. The second could help them pursue questions they previously left unanswered because they couldn't query the data themselves.

That reflects two expectations I've seen in companies. Some people want AI to take over work they don't enjoy. Others want to try things that used to be too expensive or impractical. The same tool can serve both purposes.

Automation has been around for a long time. Tools such as n8n and RPA can already handle plenty of repetitive tasks. When AI enters the picture, I'm more interested in what else it enables people to do.

In my own experience, saving time with AI hasn't led me to do more work. If I measure productivity by the amount of work I finish, it hasn't increased much. The clearest benefit has been the time saved. That also makes me want to look further: do these changes help the team get more done?

## Employees Deliver Faster. There's Still Only One Manager.

[Daren Academy's Small Talk, EP715](https://www.youtube.com/watch?v=8VSCpBCqdO4) describes a familiar situation: an employee saves several days of work with AI, submits a proposal, and still has to wait until the following week for their manager to review it. As everyone submits more work, faster, the manager still needs time to read it, find problems, and send it back for revisions.

So even if employees spend all the time they save on doing more work, they might simply add more proposals to their manager's pile.

Daren Academy's Joe suggests making experienced managers' judgment criteria explicit, so the team can use AI to check work before submitting it and reduce revision cycles.

That made me think about turning those criteria into a skill: instructions and reference material an agent can use while doing a task. Employees could document the steps they know well. Managers could document their review criteria: what information must be included, which conditions would cause a rejection, and which situations need a person to decide.

This is my own extension of the discussion. Run the checks that can happen earlier, then leave the trade-offs to the manager. The criteria also need to be adjusted based on actual results, including any problems they fail to catch.

[Tech.wav EP160](https://podcasts.apple.com/tw/podcast/ep160-ai-%E6%99%82%E4%BB%A3%E7%9A%84%E5%85%AC%E5%8F%B8%E5%B0%87%E5%BE%B9%E5%BA%95%E6%94%B9%E8%AE%8A-%E4%B8%80%E5%80%8B%E4%BA%BA%E5%A6%82%E4%BD%95%E5%89%B5%E9%80%A0%E7%99%BE%E5%80%8D%E5%83%B9%E5%80%BC-anthropic-spacexai/id1702409419?i=1000797196029) also discusses trust in agents. Host Harry recounts Lauren Tan's experience: she could ship thousands of pull requests in a single month, and even product managers and designers on the team could use agents to contribute to production features.

Harry explains that Lauren Tan put effort into cleaning up the codebase and removing bad practices, then added automated checks, skills, and verification mechanisms. Together, these created an environment where the team felt comfortable relying on agents. That makes me think we also need to take care of the environment in which agents work when we hand tasks over to them.

Looking back at the HR knowledge assistant and GenBI, I want to check a few things too. Are the documents and data definitions clear? How should answers and query results be verified? Getting these things right could reduce the need for someone to watch every step.

## When the Tools Change, the Way We Work Can Change Too

An [article on ihower's AIhao AI Engineering Blog](https://blog.aihao.tw/2026/05/31/cedric-chin-sensemaking-ai/) discusses Walmart's adoption of computers. It describes how sharing data in real time allowed stores and suppliers to make decisions using inventory information, changing how they replenished stock and worked together.

The example made me think that when information becomes easier to access, the division of work can change along with it.

GenBI helps people cross one barrier by letting them query data without writing SQL. But once they have the data, what can they handle themselves, and what still needs to wait for a manager? That part deserves attention too.

I recently heard about [business process reengineering](https://zh.wikipedia.org/zh-tw/企业流程再造): starting with the outcome we want and redesigning how the work gets done. Applied to my own work, that means laying out the process and asking: which steps can we remove? Which checks can happen earlier? Which decisions can be delegated so the work can keep moving?

I can imagine companies with hundreds or thousands of agents taking on many of the tasks we do today. If every task they finish still needs approval from the same manager, today's bottleneck will only get worse.

Along with turning tasks into skills, we need to decide how agents hand work over, when they should involve a person, and who handles problems. People need to work those things out first.

## What Should We Do With the Time We Save?

I'd like to hand over the work that can be automated to agents, so people have time to focus on **what agents still can't do for us, especially communication**.

When working across departments, having the information ready doesn't mean the other team will agree to help. Each department has its own goals and priorities. You need to understand what matters to them, explain why the work is worth doing, and **persuade them to commit time and resources**. You still need to have those conversations yourself.

The same goes for getting support from your manager and explaining the direction to your team. Agents can help prepare information and organize what you want to say. But addressing people's concerns and working out an approach everyone can accept still takes people's time.

Agents can help analyze options and lay out the pros and cons, but we still need to decide what to choose, what we're willing to give up, and which risks we're prepared to take. We also have to take responsibility for the outcome. Those trade-offs can't all be handed over to an agent.

Looking back at the HR knowledge assistant and GenBI, I'd like them to save people time searching documents and querying data, leaving them more room to use that information to discuss problems and move things forward. That's what I want to keep thinking about: once an assistant finishes its part, how do people take the work further?

> Hand over the work that can be automated to agents, and use the time saved for communication, coordination, persuasion, making decisions, and taking responsibility for the outcomes.

## References

1. **ihower / AIhao AI Engineering Blog**\
   “Stop Reading AI Predictions: Cedric Chin's Sensemaking Trilogy on Making Sense of AI”\
   [Article in Chinese](https://blog.aihao.tw/2026/05/31/cedric-chin-sensemaking-ai/)
2. **Daren Academy's Small Talk, EP715**\
   “AI Saves Employees Three Days of Work, but Their Proposals Sit on a Manager's Desk for a Week. Why Does the Process Still Get Stuck When Everyone Is Faster?”\
   [Apple Podcasts, in Chinese](https://podcasts.apple.com/tw/podcast/ep715-%E6%9C%89%E4%BA%86-ai-%E5%B9%AB%E5%93%A1%E5%B7%A5%E7%9C%81%E4%B8%8B%E4%B8%89%E5%A4%A9%E5%B7%A5%E6%99%82-%E6%8F%90%E6%A1%88%E5%8D%BB%E5%9C%A8%E4%B8%BB%E7%AE%A1%E6%A1%8C%E4%B8%8A%E8%BA%BA%E4%BA%86%E4%B8%80%E9%80%B1-%E7%82%BA%E4%BB%80%E9%BA%BC%E5%A4%A7%E5%AE%B6%E8%AE%8A%E5%BF%AB-%E6%B5%81%E7%A8%8B%E9%82%84%E6%98%AF%E5%8D%A1%E5%8D%A1%E7%9A%84/id1452688611?i=1000796378831) · [YouTube](https://www.youtube.com/watch?v=8VSCpBCqdO4&list=PL45a1lc7-gwsz8_Nt7Ao9BFavZBrz2FGK&index=4)
3. **Wikipedia: Business Process Reengineering**\
   [Entry in Chinese](https://zh.wikipedia.org/zh-tw/企业流程再造)
4. **Tech.wav EP160**\
   “Companies Will Change Completely in the AI Era: How Can One Person Create a Hundred Times the Value? Anthropic and SpaceXAI Offer a Glimpse”\
   [Apple Podcasts, in Chinese](https://podcasts.apple.com/tw/podcast/ep160-ai-%E6%99%82%E4%BB%A3%E7%9A%84%E5%85%AC%E5%8F%B8%E5%B0%87%E5%BE%B9%E5%BA%95%E6%94%B9%E8%AE%8A-%E4%B8%80%E5%80%8B%E4%BA%BA%E5%A6%82%E4%BD%95%E5%89%B5%E9%80%A0%E7%99%BE%E5%80%8D%E5%83%B9%E5%80%BC-anthropic-spacexai/id1702409419?i=1000797196029) · [YouTube](https://www.youtube.com/watch?v=1ZPtUUDPiiU)

<!-- Reference titles above are translated from Chinese. Source links and paraphrases follow the approved Chinese article. -->
