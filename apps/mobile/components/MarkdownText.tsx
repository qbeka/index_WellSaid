import React from "react";
import { StyleSheet } from "react-native";
import Markdown from "react-native-markdown-display";
import { Colors } from "../lib/colors";

type Props = {
  children: string;
};

const MarkdownText = ({ children }: Props) => {
  return (
    <Markdown style={mdStyles}>
      {children}
    </Markdown>
  );
};

const mdStyles = StyleSheet.create({
  body: {
    fontSize: 15,
    fontFamily: "DMSans_400Regular",
    color: Colors.foreground,
    lineHeight: 22,
  },
  heading1: {
    fontSize: 20,
    fontFamily: "DMSans_700Bold",
    color: Colors.foreground,
    marginBottom: 8,
    marginTop: 12,
  },
  heading2: {
    fontSize: 18,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.foreground,
    marginBottom: 6,
    marginTop: 10,
  },
  heading3: {
    fontSize: 16,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.foreground,
    marginBottom: 4,
    marginTop: 8,
  },
  strong: {
    fontFamily: "DMSans_600SemiBold",
  },
  em: {
    fontStyle: "italic",
  },
  bullet_list: {
    marginVertical: 4,
  },
  ordered_list: {
    marginVertical: 4,
  },
  list_item: {
    marginVertical: 2,
    flexDirection: "row",
  },
  bullet_list_icon: {
    fontSize: 15,
    lineHeight: 22,
    marginRight: 8,
    color: Colors.muted,
  },
  ordered_list_icon: {
    fontSize: 15,
    lineHeight: 22,
    marginRight: 8,
    color: Colors.muted,
    fontFamily: "DMSans_500Medium",
  },
  code_inline: {
    fontFamily: "monospace",
    fontSize: 13,
    backgroundColor: Colors.backgroundMuted,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    color: Colors.foreground,
  },
  fence: {
    fontFamily: "monospace",
    fontSize: 13,
    backgroundColor: Colors.backgroundMuted,
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    color: Colors.foreground,
  },
  paragraph: {
    marginVertical: 2,
  },
  link: {
    color: Colors.accent,
    textDecorationLine: "underline",
  },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.border,
    paddingLeft: 12,
    marginVertical: 6,
    opacity: 0.8,
  },
  hr: {
    backgroundColor: Colors.border,
    height: 1,
    marginVertical: 12,
  },
  table: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    marginVertical: 8,
  },
  thead: {
    backgroundColor: Colors.backgroundMuted,
  },
  th: {
    padding: 8,
    fontFamily: "DMSans_600SemiBold",
    fontSize: 13,
  },
  td: {
    padding: 8,
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
  },
  tr: {
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
});

export default MarkdownText;
