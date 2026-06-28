---
title: Zenon Network Quarterly Update Q3 2024
description: >-
  ZNN Aliens, worry not! While some of us are hitting the 'snooze' button on our
  cosmic alarms, plenty of others are already cooking up interstellar
  delicacies.
pubDate: '2024-10-15'
updatedDate: '2024-10-15'
draft: false
nostr: false
tags:
  - network-of-momentum
  - zenon
canonicalUrl: 'https://atsocy.com/zenon-network-quarterly-update-q3-2024'
heroImage: ./dd6a41ac-7a97-4208-a56d-64d84c0414f5.png
heroImageAlt: Zenon Network Quarterly Update Q3 2024
nostrEventId: 229f9ba1cb32f10b3849e033f9b75ef2540346f3ad4daf0097774bdd2e79940b
---
## Whatever happened to the awakening of the Sleeping Giant?

ZNN Aliens, worry not! While some of us are hitting the 'snooze' button on our cosmic alarms, plenty of others are already cooking up interstellar delicacies.

**TLDR**: NGMI + HFSP.

*For those not versed in alien shorthand, that's 'Not Gonna Make It' and 'Have Fun Staying Poor.' But fear not, we've got a feast of updates to keep you in the loop.*

### What's on the menu ?

Ramen and noodles. Disappointed? So are we. Aliens are doing everything they can to extend the Accelerator-Z runway. Enjoy your meal!

...But if you're wondering what contributors are really cooking, check it out:

* **Node (go-zenon) Improvements**: Served with a side of extra performance and stability. Our chefs guarantee zero crashes and 100% satisfaction.
    
* **Space-Themed Tap & Earn Mini Apps**: Freshly baked in your Telegram app. Tap like there's no tomorrow and earn rewards that are out of this world.
    
* **Supernova Support for Bitcoin Account Abstraction**: Now you can sign transactions with your Bitcoin keys. Because who needs traditional wallets when you've got alien tech?
    
* **The First zApp Leveraging unikernel-z**: So cutting-edge, even we need a manual to understand it.
    
* **Unification of the s y r i u s Desktop and Mobile Codebases**: Cross-platform harmony achieved. *The syrius wallet,* ***unburdened by what has been***.
    
* **BagSwap DEX**: The paradise of alien degens. Trade like there's no gravity.
    
* **HyperQube**: An experimental NoM layer that's so advanced, even we're not sure what it does yet.
    
* **And much, much more...**
    

*Disclaimer: This menu is subject to change based on the chef's mood, the availability of alien ingredients, and unexpected fluctuations in the UberEats-time continuum.*

You only have to **read an update every quarter to make it**.

*Commentary from the ATS has been italicized*.

Let's begin.

3... 2... 1...

## Network of Momentum Updates

* The Zenon Network [celebrated 1000 Epochs](https://x.com/Zenon_Network/status/1826309727946424530) since Alphanet inception.
    

*That's 1000 days, with 0 downtime, and 0 transaction fees paid.*  
*Maybe we also averaged 0 yearly volume, a world's first for a state-of-the-art L1.*

* ![](/images/posts/zenon-network-quarterly-update-q3-2024/455d8e79-f09a-4df9-953b-ca83fdafede2.jpeg)
    
    The first NoM extension-chain, Supernova, launched on August 7th, 2024. The native compatibility with EVM and cosmos assets, increases the ease of implementation for decentralized applications.
    
* [Aliens signaled their opinion](https://x.com/Zenon_Network/status/1823887210438889773) to expand the reach of wZNN and add bridge support for Solana.
    
* A [community-run meme contest](https://x.com/Zenon_Network/status/1823089465646264830) took place throughout August. Donations totaling 350 $ZNN were received and dispersed as part of the contest. Masterpieces of memes were dropped on a daily basis.
    
* ![](/images/posts/zenon-network-quarterly-update-q3-2024/590b8886-c275-4b35-9cac-386d5ca45985.png)
    
    The [Zenon Pillars Alliance](https://x.com/ZenonAlliance) introduced a new informational site about the ongoing Phase Z campaign. It contains information about the stages dedicated to the growth of the Zenon ecosystem. *We love the site. We really do. But we think the footer's "This website is not affiliated with Zenon Network" copy while hosted at* [*phasez.zenon.network*](https://phasez.zenon.network) *might confuse new users.*
    

## Developer Updates

To keep things concise, any items from the [previous quarterly update](https://www.atsocy.com/zenon-network-quarterly-update-q2-2024) that haven't received significant updates remain works in progress.

### Node optimizations and stability improvements

A significant refactoring effort, led by contributor [@vilkris](https://x.com/vilkris_znn) with thorough review and collaboration from [@George](https://x.com/georgezgeorgez), aims to substantially improve the performance and stability of Zenon nodes:

* Account block validation performance could be dramatically enhanced, particularly for blocks referencing old momentum heights. Processing time for a previously problematic momentum was reduced from over 10 minutes to mere milliseconds in testing.
    
* A new chain cache database is proposed to store and quickly access critical state information like plasma amounts and active sporks, potentially eliminating the need for expensive database rollbacks in many cases.
    
* The account pool's handling of large numbers of pending blocks has been optimized, addressing slowdowns that could occur with numerous unconfirmed transactions.
    
* Various database and memory management improvements are suggested to enhance overall node stability and responsiveness.
    
* Extensive benchmarking and testing was performed to validate the changes across different node configurations.
    

For those interested in a deep dive into these proposed optimizations, vilkris and george have recorded a two-part YouTube series explaining the changes in detail:

[Part 1](https://www.youtube.com/watch?v=Pb87qKrtszs)  
[Part 2](https://www.youtube.com/watch?v=CZxMgTuKSuk)

*Forget the hypnotic sleep videos, these two are much more effective.*

These optimizations are currently under review as an open pull request. The community is invited to review the changes, test the new implementation, and provide feedback. If approved and implemented, these updates should result in more consistent block production, faster transaction processing, and improved robustness for the network as a whole.

*Do we even have precise enough chronometers to measure momentum times if we run the optimized node in an unikernel-z? We might be hitting instrumentation limits.*

### HyperCore One: Special Interest Groups

In an effort spearheaded by the crew behind [HyperCore One](https://forum.hypercore.one) to organize and formalize development efforts across multiple vertices, several Special Interest Groups (SIGs) have been established. These SIGs aim to focus expertise and resources on specific areas crucial to the Zenon Network ecosystem's growth and sustainability.

*We really wanted to make the Alien Trap Society Special Interest Group, just to piss people off trying to read that, but we’ve been told the name is reserved for HC1 usage. Lucky you.*

**Software Delivery Lifecycle (SDLC) SIG**

Chaired by George, the [**SDLC SIG**](https://zenon.wiki/index.php/HC1:_SDLC_SIG) contributes to high-level planning, maintenance, and delivery of software in the Zenon Network ecosystem. This group is working on defining a robust software delivery lifecycle that aligns with the core values of Sovereignty, Civility, and Prosperity.

Key initiatives include:

* Implementing the "Work Definition through SIGs" approach, which allows contributors to work in environments relevant to their skillsets.
    
* Developing the "Incentivization is Prioritization" (IIP) model, ensuring that all critical and desired behaviors have appropriate incentives.
    
* Establishing and maintaining a code baseline to reduce technical debt and keep dependencies up to date.
    

*This is like the meta SIG, it sigs the SIGs.*

**Operations & Performance (OP) SIG**

Led by [DeeZNNutz](https://t.me/ZeroX3639), the [**OP SIG**](https://zenon.wiki/index.php/HC1:_OP_SIG) has been particularly active, with regular meetings and tangible outcomes. This group focuses on software and documentation for running, monitoring, and troubleshooting server software.

Notable achievements and ongoing projects include:

* Development of a ["1-click" znnd node installation process](https://github.com/hypercore-one/deployment), making it easier for node operators to validate the network.
    
* Implementation of observability tools to monitor node performance using the 4 Golden Signals (Latency, Traffic, Errors, Saturation).
    
* Creation of community support channels and resources, including issue trackers and FAQs.
    

The OP SIG's efforts have been instrumental in getting the community involved and familiar with the format of Special Interest Groups.

*OP stands for overpowered. Aptly named as it makes any regular user a DevOps god. But how hard can it be to add pretty colors to the CLI tools?*

**Syrius SIG**

The [**Syrius SIG**](https://zenon.wiki/index.php/HC1:_Syrius_SIG), focused on improving the user experience of the Syrius wallet, is still in its early stages without an appointed chairman. However, significant progress is being made through collaborative efforts.

A major refactoring effort is currently underway, led by John Maxwell, a collaborator who previously worked with Dr. Blaze on the Syrius mobile wallet. This refactoring aims to unify the desktop and mobile codebases, bringing numerous improvements and new features to the Syrius ecosystem:

* Implementing the bloc architecture for better code organization and maintainability
    
* Integrating EVM and Bitcoin support for the desktop application
    
* Enhancing security features, including secure storage and local authentication
    
* Updating and optimizing dependencies
    
* Implementing app flavors for easier development and testing
    
* Leveraging new Dart language features
    
* Establishing coding standards and analyzer rules
    
* Improving performance through the use of isolates
    
* Adding comprehensive unit tests and documentation
    

John has already made progress, successfully [updating the codebase to support the latest Flutter version](https://github.com/zenon-network/syrius/pull/128). This update addressed issues with deprecated widgets and resolved rendering problems across different platforms.

The SIG is open to collaboration, with John [offering guidance and documentation for developers interested in contributing](https://forum.zenon.org/t/unifying-the-desktop-and-mobile-repos-plus-more/1940/23) to specific tasks. This refactoring effort lays the groundwork for future feature development and aims to make the codebase more accessible to new contributors. While these changes are primarily focused on the technical foundation, they will ultimately benefit end-users through improved performance, increased feature parity between desktop and mobile versions, and a more robust and maintainable wallet application.

The **Syrius SIG** exemplifies the community-driven development approach of the Zenon Network, with contributors working together to enhance core infrastructure components.

**HyperQube SIG**

Chaired by George, the [HyperQube SIG](https://zenon.wiki/index.php/HC1:_HyperQube_SIG) is working on an exciting new project that promises to expand the capabilities of the Zenon Network. While details of the HyperQube project will be explored in depth later in the Ecosystem Updates section, it's worth noting that this SIG is actively developing work packages and defining capabilities that will shape the future of the network.

The establishment of these SIGs represents a significant step forward in the organization and coordination of development efforts within the Zenon ecosystem. By focusing expertise and resources on specific areas, HyperCore One is laying the groundwork for more efficient, community-driven development that aligns with the network's core values and long-term vision.

### Hello word, the first-ever zApp

In a stealthy launch that would make even the most secretive alien proud, Professor EovE7Kj [published the code for an implementation of a basic website running fully as a zApp](https://github.com/EovE7Kj/zApps/blob/main/zapp-dev/_base_/http/index.html) alongside unikernel-z.

As a proof of concept it might not look like much, but this simple website represents a giant leap that could revolutionize how we think about decentralized applications.

The Zenon Community eagerly awaits more sophisticated zApps. This humble beginning serves as a beacon of possibilities. Who knows? The next zApp might just be the killer app that makes even the most skeptical bitcoiner to believe in the power of the Network of Momentum.

### Supernova Upgrade: Account Abstraction for BTC

Supernova is advancing with a significant upgrade: Account Abstraction (AA). This enhancement enables users to sign transactions on Supernova using their Bitcoin private keys, improving the user experience and facilitating a faster onboard into the Zenon ecosystem.

Moreover, the upgrade introduces the potential for Paymaster contracts, allowing for sponsored transaction fees. With Paymasters, users can interact with the network without needing to hold native tokens for gas fees, as third parties can cover these costs on their behalf. This feature is expected to improve user experience and lower the barrier to entry for new participants in the ecosystem. For example, users will be able to claim NFTs using their preferred BTC wallet without worrying about acquiring xZNN first.

*We bought ZNN, wZNN, and xZNN. Heck, we even bought some ZNN minted on Base that’s not even related to the Zenon Network. Just in case.*

### Alien Appreciation ❤️

From the Alien Trap Society, we want to thank each and every contributor helping build out the Network of Momentum. Your work is seriously appreciated.

As a public service, and a friendly reminder, the ATS would like to bring the awareness of our developers to the following seemingly forgotten items:

* <s>PTLC User Flow Diagram</s>
    
* <s>Governance Module (work in progress)</s>
    
* P2P Lib Upgrade
    
* Initial Block Download
    
* BTC Interoperability
    
* BTC Interoperability
    
* BTC Interoperability
    

## Ecosystem Updates

### HyperQube

![](/images/posts/zenon-network-quarterly-update-q3-2024/c3fe1a64-f83c-44fa-90d4-767e755481bc.png)

The *HyperQube* initiative introduces a significant advancement aiming to create an ecosystem of community-driven extension chains for Zenon. HyperQube focuses on fostering collaborative development and bringing new functionalities to the network.

The first initiative under the HyperQube umbrella, codename **hyperqube\_z**, utilizes the same architecture as the Zenon mainnet but emphasizes participation and rapid development. It serves as a production incubator where new features can be developed and tested in a live environment before being considered for deployment on the Zenon's Alphanet.

*Just look at this name: hyperqube\_z. It reads like hyperpube\_z, powered by deeZNNutz.*  
*We thought we didn’t need Mr. Kaine anymore. We were wrong. We do. Please Mr. Kaine, comeback. This would have never happened with Kaine.*

**Why HyperQube Matters**  
HyperQube is designed to elevate Zenon by providing a dedicated environment for experimentation and rapid development. It allows for innovative features to be tested and refined without compromising the stability of the mainnet.

Think of HyperQube as Zenon's innovation lab, where bold ideas are nurtured before they're ready for prime time.

**Objectives and Roadmap**

HyperQube aims to:

* **Implement On-Chain Governance**: Introduce a governance module to enable community-driven decision-making, including signaling and voting on development priorities.
    
* **Facilitate Collaborative Development**: Deploy new embedded contracts to support an on-chain collaborative work process, streamlining contributions and ensuring fair compensation through innovative payout mechanisms.
    
* **Accelerate Innovation**: Serve as a platform for rapid development and deployment of new features such as dynamic plasma, decentralized exchanges (DEX), and experimental functionalities like on-chain microblogging.
    
* **Strengthen Mainnet Integration**: Connect hyperqube\_z to the mainnet via bridges, enabling chain and data relay through oracles, and support for bridged [ZNN](https://coinmarketcap.com/currencies/zenon/) and [QSR](https://coinmarketcap.com/currencies/quasar/) assets.
    

**Community Involvement** Community-driven development is at the heart of HyperQube. Decisions will be made via community governance, with transparency and on-chain verification. We invite all interested contributors to join the conversation and participate in the development process.

Communication Channels:  
Matrix Chat: [#sig-hyperqube .chat](https://matrix.to/#/#sig-hyperqube:hc1.chat)  
[HyperCore Forum](forum.hypercore.one/c/hyperqube/13)

Your participation is vital in shaping the future of HyperQube and, by extension, the Zenon ecosystem. After all, what's a community-driven project without the community?

**FAQs**

*Is hyperqube\_z a testnet?*

While hyperqube\_z features experimental capabilities, it is not merely a testnet. It functions as a production incubator with real value balances that need to be preserved across upgrades. In other words, it's where we innovate with care and responsibility.

*Will hyperqube\_z have smart contracts?*

Hyperqube\_z will continue to develop functionality using embedded smart contracts and may explore adding a generic smart contract runtime based on community demand.

Is HyperQube a replacement for Zenon?

No, HyperQube is designed to complement Zenon by providing an environment for rapid development and testing. It seeks to enhance the Zenon ecosystem, not replace it.

**Rest assured, the mothership remains intact. HyperQube is more like the shiny new shuttle we've added to the fleet.**

### Telegram Mini Apps

Aliens are slowly but surely taking over the world of Telegram with engaging Mini Apps, bridging the advantages of feeless transactions to millions of users. While still under heavy development, keep an eye on:

**Syrius Telegram Wallet + Tap 2 Earn**

A ported version of the Syrius Chrome extension is now live, running as a Telegram Mini App. It includes an engaging Tap 2 Earn mechanism, with a daily streak bonus. More features and gamified experiences are still under development.

Check it out: [t.me/SyriusWalletBot](https://t.me/syriuswalletbot)

*Because who doesn't want to click collect while jumping from one alt to another between Zenon chats? Convenience is key.*

![](/images/posts/zenon-network-quarterly-update-q3-2024/4ef7c4b3-d624-406a-964c-eb1d73cacefe.png)

**Plasmaton App**

An intriguing new mini app still in closed beta has been circulating around the community. It includes a referral program and social mechanics around an escape the room type experience that unlocks on-chain rewards.

Check it out: [t.me/PlasmatonBot](https://t.me/plasmatonbot)

![](/images/posts/zenon-network-quarterly-update-q3-2024/59ea7cde-a741-43bb-baf7-39fb9f59ed46.png)

### Alienswap

Just 20 days after Supernova's launch, [Alienswap.fun](https://alienswap.fun), the first decentralized exchange, was up and running. This is the power of EVM compatibility in action. Experiment with Supernova and use the faucet to claim free Z's test tokens at [faucet.alienswap.fun](https://faucet.alienswap.fun).

![](/images/posts/zenon-network-quarterly-update-q3-2024/651e9143-c274-4f1c-9ae6-7780bcd92a4d.png)

### BagSwap

![](/images/posts/zenon-network-quarterly-update-q3-2024/7e9f6642-abbf-4dbb-a243-e80eb7c17632.jpeg)

[BagSwap](https://x.com/BagSwap), the latest addition to the Zenon ecosystem, is gearing up to become the go-to decentralized exchange (DEX) for Supernova.

* **Brand Mark**: An upside-down paper bag, symbolizing the chaotic and rebellious spirit of the crypto community. It's designed to be meme-friendly and inspire creative content from the community.
    
* **Crypto Culture Tie-In**: The paper bag is a nod to "holding bags" during market downturns. *How about when your bag experiences NO market turns? Asking for a friend.*
    
* **Domains Secured**: BagSwap.com, .org, and .lol have been acquired and will be transferred to a community member to run the venture.  
    *Because nothing says commitment like a .lol domain.*
    
* **Accelerator-Z Proposal**: An Accelerator-Z proposal is in the works to fund the development of the DEX on Supernova's EVM.
    

The goal is for BagSwap to become a cornerstone of the Zenon ecosystem, offering secure and efficient decentralized swaps.

![](/images/posts/zenon-network-quarterly-update-q3-2024/adf06ea4-2330-412a-ab38-f7dcb172badf.png)

### Conference and Media Appearances

# **¯\\\_(ツ)\_/¯**

[*Sugoi*](https://x.com/sugoibtc) *might have maybe worn a ZNN hoodie to Bitcoin Amsterdam 2024. That’s about it. Not looking good.*

*ATS proposes a* [*Monkey App*](https://monkey.app) *SIG to make aliens more extroverted and less shy.*

## TMZNN

It's TMZ, but the stars are all little green men.

* [Enjoy It](https://t.me/kekekekekekrkek) achieved the Guiness World Record for entering and leaving a telegram group.
    
* Goldmoon got simultaneously green pilled and fudded by alts. *He is basically the Zenon version of Schrödinger's cat. He is both in and out of the community.*
    
* [TheDev1776](https://x.com/TheDev1776) got officially rate limited by X for replying to a Nano fan at inhuman speeds. *We had one alien shilling Zenon. Now we are back at 0.*
    

Thanks for orbiting with us to the final frontier of this update. The Zenon ecosystem is thriving, with so many exciting developments in progress that we'll need to start writing the next update tomorrow.
