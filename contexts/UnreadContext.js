import React, { createContext, useState, useContext, useEffect } from 'react';
import chatService from '../services/chatService';

const UnreadContext = createContext({ unreadCount: 0, refreshUnread: () => {} });

export const UnreadProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnread = async () => {
    const result = await chatService.getUnreadCount().catch(() => null);
    if (result?.success) setUnreadCount(result.data?.unread_count || 0);
  };

  useEffect(() => {
    refreshUnread();
    const interval = setInterval(refreshUnread, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <UnreadContext.Provider value={{ unreadCount, refreshUnread }}>
      {children}
    </UnreadContext.Provider>
  );
};

export const useUnread = () => useContext(UnreadContext);
