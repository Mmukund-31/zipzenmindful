import { Bot } from "lucide-react";

export default function Chat() {
  return (
    <div className="h-screen flex flex-col pb-20">
      {/* Chat Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-border p-4 flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-medium text-foreground">MindEase AI Coach</h3>
          <div className="flex items-center text-xs text-green-600">
            <span className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse"></span>
            Specialized Mental Wellness AI
          </div>
        </div>
      </div>

      {/* Chatbase Integration */}
      <div className="flex-1 bg-muted">
        <iframe
          src="https://www.chatbase.co/chatbot-iframe/ZBNqABCU1-xQLC7KAsugv"
          width="100%"
          height="100%"
          frameBorder="0"
          className="w-full h-full"
          title="Mental Wellness AI Coach"
        />
      </div>
    </div>
  );
}