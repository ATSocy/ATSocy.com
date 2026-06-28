---
title: 'A-Z: The Engine of Innovation'
description: Y Combinator got an upgrade.
pubDate: '2024-07-24'
updatedDate: '2024-07-24'
draft: false
tags:
  - accelerator-z
  - zenon-network
canonicalUrl: 'https://atsocy.com/a-z-the-engine-of-innovation'
heroImage: ./38edfc24-ec8c-4dcc-82c1-cf2c4ed1fda3.png
heroImageAlt: 'A-Z: The Engine of Innovation'
nostrEventId: 7086fb9c08bca730c4802c7c28feb195d3c2a9d844826a2a119def39062a7176
---
Most people think of cryptocurrencies as just digital money. But that's like saying the internet is just email. The real power lies in what you can build on top of these systems. [Accelerator-Z](https://www.zenon.org/en/funding/process) is one of those things, a way to fund and grow new projects within the [Zenon Network](https://zenon.network) ecosystem.

When I first heard about Accelerator-Z, I thought it was just another grant program. But it's actually much more interesting than that. It's like Y Combinator for a specific blockchain network (one [made by aliens](https://zenon.network/#build), and perfectly [aligned with the Bitcoin ethos](https://x.com/zenon_network)) but with some crucial differences.

## Decentralized Funding Model

The first thing that makes Accelerator-Z unusual is how projects get funded. In a typical accelerator, a small group of partners decides which startups to back. With Accelerator-Z, it's the community that votes. Anyone who holds Zenon's cryptocurrency (ZNN) can have a say in which projects get funded.

This decentralized funding model is implemented through the Network of Momentum's (NoM) on-chain governance system. Pillar nodes, which are validators in the Zenon Network, [cast votes on proposals](https://zenon.tools/accelerator).

This might sound like a recipe for chaos, but it's surprisingly effective. The people voting have skin in the game: they own part of the network, so they're incentivized to back projects that will increase its value. It's like if Y Combinator's decisions were made by all of Silicon Valley instead of just a few partners.

## Phased Funding Approach

The second interesting thing about Accelerator-Z is how it handles the funding process. Most accelerators give startups a lump sum upfront. Accelerator-Z breaks funding into phases. A project might get a small amount to build a prototype, then more to launch a beta, and so on. Each phase has to be approved by another community vote.

This iterative funding model solves a problem that plagues many grant programs: the temptation for founders to take the money and run. With Accelerator-Z, founders have to keep delivering to keep getting funded. It aligns incentives in a way that traditional grant programs often struggle with.

The phased approach also allows for more granular control over the allocation of resources. Each proposal can have multiple phases, and the community can evaluate progress at each stage before committing additional funds.

## Zenon Fabric: The Funding Pool

Accelerator-Z is bootstrapped by the [Zenon Fabric](https://medium.com/@zenon.network/zenon-fabric-paving-the-way-for-mass-scale-adoption-12f0ecd5411a), a substantial pool of ZNN and QSR (the dual-coin system of Zenon) set aside for ecosystem development. As of the latest information, the [AZ embedded contract](https://zenonhub.io/explorer/account/z1qxemdeddedxaccelerat0rxxxxxxxxxxp4tk22) contains:

* 766,260 ZNN
    
* 7,021,959 QSR
    

This significant funding pool ensures that Accelerator-Z can support a wide range of projects across various stages of development.

## Types of Projects Supported

Accelerator-Z is designed to support a diverse range of projects that can add value to the Zenon ecosystem. Some of the key areas include:

1. Design
    
2. DeFi applications
    
3. Gaming and GameFi
    
4. Internet of Things (IoT) solutions
    
5. Payment integrations
    
6. Decentralized storage solutions
    
7. Decentralized social networks
    
8. NFT platforms
    
9. Developer tools and SDKs
    
10. Marketing ... and more!
    

This broad scope allows Accelerator-Z to foster innovation across multiple fronts, potentially leading to a rich and diverse ecosystem built on the Zenon Network.

## The Application Process

The process for applying to Accelerator-Z is straightforward but thorough:

1. *Optional*: Create a proposal on the [Zenon forum](https://forum.zenon.org) for community discussion (Recommended)
    
2. Submit a formal proposal through the Syrius wallet (one ZNN cost to prevent spam)
    
3. If approved, implement the project in phases
    
4. Submit deliverables for each phase for community review
    
5. Receive funding upon successful completion of each phase
    

This process ensures transparency and allows for community input at multiple stages.

![](/images/posts/a-z-the-engine-of-innovation/72ad4159-af3c-4350-8c2c-4eaac643f7a0.webp)

## Reaching Consensus

One of the trickiest parts of any decentralized system is figuring out how decisions get made. With Accelerator-Z, this comes down to how votes are counted and when a decision is considered final. It's not enough to just count votes - you need a way to ensure that enough people participated to make the decision legitimate.

This is where the concept of quorum comes in. In Accelerator-Z, a vote isn't just about whether more people said yes than no. It's also about whether enough people voted at all. Here's how it's implemented in the code:

```go
func checkAcceleratorVotes(context vm_context.AccountVmContext, id types.Hash, numPillars uint32) bool {
    breakdown := definition.GetVoteBreakdown(context.Storage(), id)

    ok := true
    // Test majority
    if breakdown.Yes <= breakdown.No {
        ok = false
    }
    // Test enough votes
    if breakdown.Total*100 <= numPillars*constants.VoteAcceptanceThreshold {
        ok = false
    }

    acceleratorLog.Debug("check accelerator votes", "votes", breakdown, "status", ok)
    return ok
}
```

This function does two crucial things. First, it checks if there are more 'yes' votes than 'no' votes. But it doesn't stop there. It also checks if the total number of votes meets a certain threshold compared to the total number of pillars (validators) in the network.

```go
VoteAcceptanceThreshold        uint32 = 33
```

For example, with 100 pillars and a **VoteAcceptanceThreshold** of 33%, at least 33 votes must be cast in total. Suppose there are 25 'yes' votes and 10 'no' votes, making 35 votes in total. Quorum is reached since 35 &gt; 33 and 25 &gt; 10, satisfying both the participation and majority conditions. Thus, the decision is considered legitimate and supported.

This solves a real problem: low turnout. If only a tiny fraction of the community votes, the result isn't representative. Requiring participation means decisions need broad support, not just a majority of a small group. There's a trade-off. It's harder to push things through quickly. A project can have majority support and still fail if not enough people vote. But for a system dealing with real money and real projects, deliberate is better than fast.

## Challenges and Potential Pitfalls

Of course, this model isn't without its challenges. Voting systems can be gamed. Community decisions can be swayed by [hype rather than substance](https://medium.com/@john_84734/pr-banner-ads-for-nom-c343b46d8ee5). And there's always the risk that the loudest voices will drown out the most innovative ideas.

There's also the challenge of ensuring that technical proposals are properly evaluated. To address this, the Zenon community has discussed the possibility of bringing in technical advisors to help assess the feasibility and potential impact of highly technical proposals.

## The Bigger Picture

Despite those pitfalls, what Accelerator-Z represents is worth paying attention to: an experiment in decentralized innovation funding that might fail, or might show a new way to fund technological progress.

The interesting part is that Zenon is dogfooding its own philosophy. It's using its own technology to solve the problem of how to grow its ecosystem. It's a bit like if Y Combinator used the startups it funded to run its application process or manage its investments.

That's a self-reinforcing loop. Every successful project Accelerator-Z funds makes the Zenon Network more valuable, which gives Accelerator-Z more resources to fund the next round.

## The Future of Innovation Funding

Will Accelerator-Z produce the next Google or Facebook? Probably not. But it might produce the next big thing in decentralized finance, distributed computing, or whatever else gets built on top of blockchain networks.

The open questions are the real takeaway. How do you design voting systems that reward long-term thinking? How do you balance the wisdom of the crowd with the need for expert curation? Those are worth thinking about whether Accelerator-Z itself succeeds or not.

So keep an eye on Accelerator-Z. Not because it's going to make you rich (though it might), but because the model itself is the interesting part: a system where the lines between users, developers, and investors blur, and good ideas can come from anywhere and be funded by everyone.

That's a future worth accelerating towards.
