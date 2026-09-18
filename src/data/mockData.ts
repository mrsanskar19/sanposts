import {
  BrandAsset,
  BrandDetails,
  Conversation,
  PostPreview,
  PromptStarter,
  ScheduledPost,
  SocialPlatform,
  UserProfile,
} from '@/types';

export const mockUserProfile: UserProfile = {
  name: 'Sanskar Tiwari',
  email: 'sanskar@sanposts.ai',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  plan: 'Pro',
  creditsUsed: 28,
  creditsTotal: 100,
  isLoggedIn: true,
};

export const mockBrandDetails: BrandDetails = {
  brandName: 'SanPosts Studio',
  tagline: 'High-signal multi-platform content engine for modern builders.',
  toneOfVoice: 'Authoritative, direct, punchy, and data-backed.',
  targetAudience: 'Founders, software engineers, indie hackers, and growth leaders.',
  defaultHashtags: ['#buildinpublic', '#startups', '#saas', '#techinnovation'],
};

export const mockBrandImages: BrandAsset[] = [
  {
    id: 'asset-1',
    title: 'Minimalist Architecture & Design',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
    category: 'Architecture',
    dimensions: '1920x1080',
  },
  {
    id: 'asset-2',
    title: 'Code Editor & Deep Focus Workspace',
    url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
    category: 'Engineering',
    dimensions: '1920x1080',
  },
  {
    id: 'asset-3',
    title: 'Analytics Dashboard & Growth Curves',
    url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
    category: 'Analytics',
    dimensions: '1600x900',
  },
  {
    id: 'asset-4',
    title: 'Creative Studio Moodboard',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    category: 'Abstract',
    dimensions: '1200x1200',
  },
  {
    id: 'asset-5',
    title: 'Team Collaboration & Brainstorming',
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
    category: 'People',
    dimensions: '1800x1200',
  },
];

export const mockSavedPosts: PostPreview[] = [];

export const mockPromptStarters: PromptStarter[] = [
  {
    id: 'starter-1',
    icon: '🚀',
    title: 'Product Launch',
    prompt: 'Launch a developer tool that turns Markdown notes into multi-platform social posts in seconds.',
  },
  {
    id: 'starter-2',
    icon: '💡',
    title: 'Founder Lessons',
    prompt: '5 non-obvious lessons learned after building and shipping 10 SaaS micro-products in one year.',
  },
  {
    id: 'starter-3',
    icon: '🔥',
    title: 'Contrarian Hook',
    prompt: 'Why 90% of automated marketing tools fail, and what high-growth teams do differently.',
  },
  {
    id: 'starter-4',
    icon: '📊',
    title: 'Case Study',
    prompt: 'How an early-stage startup grew organic engagement by 340% without running any paid ads.',
  },
];

export const generateSamplePostsForPlatforms = (
  userPrompt: string,
  platforms: SocialPlatform[],
  attachedImage?: string
): PostPreview[] => {
  const prompt = userPrompt.trim() || 'Product Innovation & Social Strategy';
  const fallbackImage = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80';
  const postImage = attachedImage || fallbackImage;

  const templates: Record<SocialPlatform, Omit<PostPreview, 'id' | 'platform'>> = {
    linkedin: {
      title: 'LinkedIn Thought Leadership',
      content: `Most teams waste hours rewriting the exact same message across channels.

Here is the framework we used for "${prompt}":

1. Start with the core problem: Don't bury the lead.
2. Outline the tactical workflow: Concrete steps always beat vague advice.
3. Quantify the outcome: Give peers a tangible benchmark to evaluate.

The goal isn't just visibility—it's driving meaningful discussions with decision-makers.

What has been your most effective distribution channel this quarter?`,
      hashtags: ['#ProductStrategy', '#Leadership', '#B2BGrowth', '#Innovation'],
      imageUrl: postImage,
    },
    twitter: {
      title: 'X / Twitter High-Impact Hook',
      content: `Most people overcomplicate content distribution.

Here is how we think about "${prompt}":

• Lead with a crisp tension
• Cut 50% of the fluff words
• Attach proof (real screenshot or metric)
• Never post without a takeaway

Retweet if you agree. 🔁`,
      hashtags: ['#buildinpublic', '#startups', '#growth'],
      imageUrl: postImage,
    },
    instagram: {
      title: 'Instagram Carousel & Visual Caption',
      content: `The difference between average reach and category leadership isn't luck—it's repeatable leverage. ✨

Swipe through to see our blueprint for:
"${prompt}"

📌 Save this post for your next content sprint.
💬 Tell us in the comments: which takeaway will you test first?`,
      hashtags: ['#creatorbusiness', '#contentcreator', '#brandstrategy', '#productivity', '#growthmindset'],
      imageUrl: postImage,
    },
    facebook: {
      title: 'Facebook Community Story',
      content: `Quick question for the founders and marketers in this group:

When executing on "${prompt}", what is the biggest challenge your team runs into?

We just ran a small experiment breaking down this message into focused, platform-tailored variations. The result? 3x more comments and genuine peer feedback.

Drop your thoughts below—let's discuss what's working right now!`,
      hashtags: ['#Community', '#StartupLife', '#MarketingTips'],
      imageUrl: postImage,
    },
    reddit: {
      title: 'Reddit Community Breakdown & AMA',
      content: `[Breakdown] What we learned while tackling "${prompt}" (raw data & takeaways)

Hey r/startups,

I wanted to share a transparent breakdown of what actually moved the needle for us when executing this:

• What failed: Relying on generic automated copy with zero perspective.
• What worked: Writing specific, direct takeaways with actual lessons learned.
• Key surprise: Direct, humble posts without hype generated 5x more organic reach.

No sales pitch here. Happy to answer any questions in the comments about our stack or numbers!`,
      hashtags: ['#startups', '#entrepreneur', '#case_study'],
      imageUrl: postImage,
    },
    blog: {
      title: 'Blog / Longform Article Digest',
      content: `## The Modern Playbook: ${prompt}

In today's fast-moving software landscape, how you package your ideas determines whether your product gets discovered or ignored.

### Core Strategic Pillars:
1. **Audience-Native Context**: What resonates on LinkedIn looks like spam on Reddit. Tailor tone to the venue.
2. **Signal Density**: Respect the reader's attention span by front-loading your highest-value insight.
3. **Actionable Takeaways**: Give readers an exercise or framework they can implement immediately.

### Conclusion:
Treat distribution with the same engineering rigor as your core product code.`,
      hashtags: ['#TechStrategy', '#EngineeringLeadership', '#WritingTips'],
      imageUrl: postImage,
    },
    threads: {
      title: 'Threads Casual Drop',
      content: `Honest take on "${prompt}":

If your message doesn't make someone stop scrolling in 1.5 seconds, you are writing for yourself, not your audience.

What's one thing you are simplifying this week? 🧵`,
      hashtags: ['#threads', '#creators'],
      imageUrl: postImage,
    },
    newsletter: {
      title: 'Newsletter Curated Briefing',
      content: `Subject: Quick briefing on ${prompt} 📬

Hey everyone,

Here is your 2-minute breakdown on how to approach this effectively:

- The Main Insight: Don't repeat the status quo; highlight what changed.
- The Metric to Watch: Dwell time and replies over vanity impressions.
- Action Item: Test one new platform angle before Friday.

Hit reply and let me know your thoughts!`,
      hashtags: ['#newsletter', '#weeklydispatch'],
      imageUrl: postImage,
    },
    medium: {
      title: 'Medium Editorial Perspective',
      content: `### Rethinking Modern Distribution: A Deep Dive into ${prompt}

When we look back at the most enduring product launches of the last decade, they all share one quality: uncompromised clarity.

In this story, we deconstruct the operational architecture behind high-converting multi-platform distribution and why founder-led media is replacing traditional PR.`,
      hashtags: ['#Technology', '#VentureCapital', '#Writing'],
      imageUrl: postImage,
    },
  };

  return platforms.map(plat => {
    const template = templates[plat] || templates.twitter;
    return {
      id: `post-${plat}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      platform: plat,
      title: template.title,
      content: template.content,
      hashtags: template.hashtags,
      imageUrl: template.imageUrl,
      isSaved: false,
    };
  });
};

export const mockConversations: Conversation[] = [];

export const mockScheduledPosts: ScheduledPost[] = [];

export const defaultApiKeys = {
  openai: '',
  anthropic: '',
  gemini: '',
  groq: '',
  deepseek: '',
  defaultModel: 'gpt-4o',
};

