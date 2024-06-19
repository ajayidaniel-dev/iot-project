import React, { Children } from "react";
import { Text } from "react-native";

const TextRegular = ({ className, ...props }) => {
  return <Text {...props} className={`font-sora-medium ${className}`} />;
};

export default TextRegular;
