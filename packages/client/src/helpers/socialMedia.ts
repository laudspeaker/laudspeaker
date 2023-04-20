export enum SocialMedia {
  Facebook = "Facebook",
  LinkedIn = "LinkedIn",
  Instagram = "Instagram",
  Pinterest = "Pinterest",
  TikTok = "TikTok",
  Twitter = "Twitter",
  YouTube = "YouTube",
  Unknown = "Unknown",
}

export function getSocialMediaPlatform(url: string): SocialMedia {
  const urlLower = url.toLowerCase();

  if (urlLower.includes("facebook.com") || urlLower.includes("fb.com")) {
    return SocialMedia.Facebook;
  } else if (urlLower.includes("linkedin.com")) {
    return SocialMedia.LinkedIn;
  } else if (urlLower.includes("instagram.com")) {
    return SocialMedia.Instagram;
  } else if (urlLower.includes("pinterest.com")) {
    return SocialMedia.Pinterest;
  } else if (urlLower.includes("tiktok.com")) {
    return SocialMedia.TikTok;
  } else if (urlLower.includes("twitter.com")) {
    return SocialMedia.Twitter;
  } else if (
    urlLower.includes("youtube.com") ||
    urlLower.includes("youtu.be")
  ) {
    return SocialMedia.YouTube;
  } else {
    return SocialMedia.Unknown;
  }
}
