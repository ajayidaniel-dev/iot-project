import React, { Children } from "react";
import { Text } from "react-native";

const TextBold = ({ className, ...props }) => {
  return <Text {...props} className={`font-sora-sb ${className}`} />;
};

export default TextBold;
