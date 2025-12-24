 "use client"
/**
 * @param {string} colorKey 
 * @param {string} colorValue 
 * @param {Object} newTheme 
 * @param {Function} setNewTheme 
 */
export const handleThemeColorChange = (colorKey, colorValue, newTheme, setNewTheme) => {
  setNewTheme({
    ...newTheme,
    colors: {
      ...newTheme.colors,
      [colorKey]: colorValue
    }
  });
};

/**
 * @param {string} colorValue 
 * @param {Object} theme
 * @returns {Object} 
 */
export const updateAllBackgrounds = (colorValue, theme) => {
  return {
    ...theme,
    colors: {
      ...theme.colors,
      headerBg: colorValue,
      heroBg: colorValue,
      featureSectionBg: colorValue,
      featureBg: colorValue,
      ctaBg: colorValue
    }
  };
};

/**
 * @param {string} colorValue 
 * @param {string} purpose 
 * @param {string} mediaType 
 * @param {Object} theme 
 * @param {Object} landingContent
 * @param {Function} setLandingContent 
 * @returns {Object} 
 */
export const updateCTASettings = (colorValue, purpose, mediaType, theme, landingContent, setLandingContent) => {

  const ctaConfigs = {
    signup: {
      title: "Ready to create your first election?",
      subtitle: "Sign up now to get started with TrustElect",
      buttonText: "Sign Up",
      buttonUrl: "/signup"
    },
    demo: {
      title: "Want to see how it works?",
      subtitle: "Request a demo to experience TrustElect in action",
      buttonText: "Request Demo",
      buttonUrl: "/request-demo"
    },
    contact: {
      title: "Questions about our platform?",
      subtitle: "Our team is ready to help your institution",
      buttonText: "Contact Us",
      buttonUrl: "/contact"
    },
    learn: {
      title: "Discover what TrustElect can do for you",
      subtitle: "Learn more about our features and benefits",
      buttonText: "Learn More",
      buttonUrl: "/features"
    },
    quote: {
      title: "Ready to get started?",
      subtitle: "Request a customized quote for your institution",
      buttonText: "Get Quote",
      buttonUrl: "/quote"
    },
    custom: {
      title: landingContent?.callToAction?.title || "Ready to modernize your election process?",
      subtitle: landingContent?.callToAction?.subtitle || "Join thousands of educational institutions using TrustElect",
      buttonText: landingContent?.callToAction?.buttonText || "Get Started",
      buttonUrl: landingContent?.callToAction?.buttonUrl || "/contact"
    }
  };

  if (landingContent && setLandingContent) {
    const ctaConfig = purpose && ctaConfigs[purpose] ? ctaConfigs[purpose] : ctaConfigs.custom;
    
    const updatedContent = {
      ...landingContent,
      callToAction: {
        ...landingContent.callToAction,
        title: ctaConfig.title,
        subtitle: ctaConfig.subtitle,
        buttonText: ctaConfig.buttonText,
        buttonUrl: ctaConfig.buttonUrl,
        mediaType: mediaType || "none",
        bgColor: colorValue || landingContent.callToAction.bgColor
      }
    };
    
    setLandingContent(updatedContent);
  }
  return {
    ...theme,
    colors: {
      ...theme.colors,
      ctaBg: colorValue || theme.colors.ctaBg
    },
    ctaConfig: {
      ...theme.ctaConfig,
      purpose: purpose || theme.ctaConfig?.purpose || "default",
      mediaType: mediaType || theme.ctaConfig?.mediaType || "none"
    }
  };
};

/**

 * @param {Object} theme 
 * @param {Object} landingContent 
 * @param {Function} setLandingContent 
 * @param {Function} saveContent 
 * @param {Function} setIsLoading 
 * @param {Function} setSaveStatus 
 */
export const applyThemeColors = (theme, landingContent, setLandingContent, saveContent, setIsLoading, setSaveStatus) => {
  const updatedContent = JSON.parse(JSON.stringify(landingContent));

  updatedContent.header = updatedContent.header || {};
  updatedContent.header.bgColor = theme.colors.headerBg || updatedContent.header.bgColor || "#01579B";
  updatedContent.header.textColor = theme.colors.headerText || updatedContent.header.textColor || "#ffffff";
  
  updatedContent.hero.bgColor = theme.colors.heroBg;
  updatedContent.hero.textColor = theme.colors.heroText;

  updatedContent.features.sectionBgColor = theme.colors.featureSectionBg;

  updatedContent.features.columns = updatedContent.features.columns.map(column => ({
    ...column,
    bgColor: theme.colors.featureBg,
    textColor: theme.colors.featureText
  }));

  updatedContent.callToAction.bgColor = theme.colors.ctaBg;
  updatedContent.callToAction.textColor = theme.colors.ctaText;

  if (theme.ctaConfig) {
    if (theme.ctaConfig.purpose && theme.ctaConfig.purpose !== "default") {
      return updateCTASettings(
        theme.colors.ctaBg,
        theme.ctaConfig.purpose,
        theme.ctaConfig.mediaType,
        theme,
        updatedContent,
        setLandingContent
      );
    }
  }

  setLandingContent(updatedContent);
  
  setIsLoading(true);

  setTimeout(() => {
    setIsLoading(false);
    setSaveStatus("Saving theme changes...");
    
    saveContent().then(() => {
      setSaveStatus("Theme applied and saved!");
      setTimeout(() => setSaveStatus(""), 3000);
    }).catch(error => {
      console.error("Error saving theme changes:", error);
      setSaveStatus("Theme applied but not saved - click Save All Changes");
    });
  }, 300);
}; 