/**
 * Input: None (animation configuration)
 * Output: Animation transition presets
 * Pos: Animation configuration for smooth micro-interactions
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import { LayoutAnimation } from 'react-native';

/**
 * Ease in-out transition for smooth property changes
 * Use for: Opacity, color, and general state changes
 */
export const easeInOutTransition: LayoutAnimation.LayoutAnimationConfig = {
  duration: 250,
  create: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
  update: {
    type: LayoutAnimation.Types.easeInEaseOut,
  },
  delete: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
};

/**
 * Spring transition for natural, bouncy animations
 * Use for: Expand/collapse, scale changes
 */
export const springTransition: LayoutAnimation.LayoutAnimationConfig = {
  duration: 300,
  create: {
    type: LayoutAnimation.Types.spring,
    property: LayoutAnimation.Properties.scaleXY,
    springDamping: 0.7,
  },
  update: {
    type: LayoutAnimation.Types.spring,
    springDamping: 0.7,
  },
  delete: {
    type: LayoutAnimation.Types.spring,
    property: LayoutAnimation.Properties.scaleXY,
    springDamping: 0.7,
  },
};

/**
 * Fast transition for quick feedback
 * Use for: Button presses, small state changes
 */
export const fastTransition: LayoutAnimation.LayoutAnimationConfig = {
  duration: 150,
  create: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
  update: {
    type: LayoutAnimation.Types.easeInEaseOut,
  },
};

/**
 * Linear transition for constant-speed animations
 * Use for: Loading states, progress indicators
 */
export const linearTransition: LayoutAnimation.LayoutAnimationConfig = {
  duration: 250,
  create: {
    type: LayoutAnimation.Types.linear,
    property: LayoutAnimation.Properties.opacity,
  },
  update: {
    type: LayoutAnimation.Types.linear,
  },
};
