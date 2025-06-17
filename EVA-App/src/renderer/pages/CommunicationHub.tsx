import React, { useState, useEffect, useContext } from 'react';
import { CharacterContext } from '../App';

interface MailHeader {
  mail_id: number;
  subject?: string;
  from?: number;
  timestamp: string;
  labels?: number[];
  recipients?: Array<{
    recipient_id: number;
    recipient_type: 'alliance' | 'character' | 'corporation' | 'mailing_list';
  }>;
  is_read?: boolean;
}

interface Contact {
  contact_id: number;
  contact_type: 'character' | 'corporation' | 'alliance';
  standing: number;
  label_ids?: number[];
  is_watched?: boolean;
  is_blocked?: boolean;
}

interface CommunicationMetrics {
  totalMails: number;
  unreadMails: number;
  totalContacts: number;
  friendlyContacts: number;
  neutralContacts: number;
  hostileContacts: number;
  watchedContacts: number;
  blockedContacts: number;
  recentConversations: Array<{
    contactId: number;
    contactName: string;
    lastMessageDate: string;
    messageCount: number;
    contactType: string;
    standing: number;
  }>;
}

const CommunicationHub: React.FC = () => {
  const { activeCharacter, isAuthenticated } = useContext(CharacterContext);
  const [mails, setMails] = useState<MailHeader[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [metrics, setMetrics] = useState<CommunicationMetrics>({
    totalMails: 0,
    unreadMails: 0,
    totalContacts: 0,
    friendlyContacts: 0,
    neutralContacts: 0,
    hostileContacts: 0,
    watchedContacts: 0,
    blockedContacts: 0,
    recentConversations: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'inbox' | 'contacts' | 'compose'>('overview');
  const [contactFilter, setContactFilter] = useState<'all' | 'friendly' | 'neutral' | 'hostile' | 'watched'>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && activeCharacter) {
      loadCommunicationData();
    } else {
      setLoading(false);
    }
  }, [activeCharacter, isAuthenticated]);

  const loadCommunicationData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📧 Loading communication data...');

      // Fetch mail and contacts in parallel
      const [mailResult, contactsResult] = await Promise.allSettled([
        window.electronAPI.esi.getCharacterMail(),
        window.electronAPI.esi.getCharacterContacts()
      ]);

      // Process mail
      if (mailResult.status === 'fulfilled') {
        const mailData = mailResult.value.map((mail: any) => ({
          ...mail,
          subject: mail.subject || 'No Subject',
          is_read: mail.is_read ?? false // Default to unread if not specified
        }));
        setMails(mailData);
      }

      // Process contacts
      if (contactsResult.status === 'fulfilled') {
        setContacts(contactsResult.value);
      }

      // Calculate metrics
      calculateCommunicationMetrics(
        mailResult.status === 'fulfilled' ? mailResult.value : [],
        contactsResult.status === 'fulfilled' ? contactsResult.value : []
      );

    } catch (error: any) {
      console.error('Failed to load communication data:', error);
      setError('Failed to load communication data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateCommunicationMetrics = (mailData: any[], contactData: any[]) => {
    // Mail metrics
    const totalMails = mailData.length;
    const unreadMails = mailData.filter(mail => !mail.is_read).length;

    // Contact metrics
    const totalContacts = contactData.length;
    const friendlyContacts = contactData.filter(c => c.standing > 0).length;
    const neutralContacts = contactData.filter(c => c.standing === 0).length;
    const hostileContacts = contactData.filter(c => c.standing < 0).length;
    const watchedContacts = contactData.filter(c => c.is_watched).length;
    const blockedContacts = contactData.filter(c => c.is_blocked).length;

    // Recent conversations (simplified - based on mail senders)
    const conversationMap = new Map<number, { 
      count: number; 
      lastDate: string; 
      contactType: string; 
      standing: number 
    }>();

    mailData.forEach(mail => {
      if (mail.from) {
        const existing = conversationMap.get(mail.from) || { 
          count: 0, 
          lastDate: mail.timestamp, 
          contactType: 'character',
          standing: 0
        };
        
        existing.count++;
        if (new Date(mail.timestamp) > new Date(existing.lastDate)) {
          existing.lastDate = mail.timestamp;
        }

        // Find standing from contacts
        const contact = contactData.find(c => c.contact_id === mail.from);
        if (contact) {
          existing.standing = contact.standing;
          existing.contactType = contact.contact_type;
        }

        conversationMap.set(mail.from, existing);
      }
    });

    const recentConversations = Array.from(conversationMap.entries())
      .map(([contactId, data]) => ({
        contactId,
        contactName: `Contact ${contactId}`, // Would be resolved from names service
        lastMessageDate: data.lastDate,
        messageCount: data.count,
        contactType: data.contactType,
        standing: data.standing
      }))
      .sort((a, b) => new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime())
      .slice(0, 10);

    setMetrics({
      totalMails,
      unreadMails,
      totalContacts,
      friendlyContacts,
      neutralContacts,
      hostileContacts,
      watchedContacts,
      blockedContacts,
      recentConversations
    });
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const getStandingColor = (standing: number): string => {
    if (standing > 5) return 'var(--success-green)';
    if (standing > 0) return 'var(--info-blue)';
    if (standing === 0) return 'var(--warning-orange)';
    if (standing > -5) return 'var(--danger-red)';
    return '#8B0000'; // Dark red for very hostile
  };

  const getStandingLabel = (standing: number): string => {
    if (standing > 5) return 'Excellent';
    if (standing > 0) return 'Good';
    if (standing === 0) return 'Neutral';
    if (standing > -5) return 'Bad';
    return 'Terrible';
  };

  const getContactTypeIcon = (type: string): string => {
    switch (type) {
      case 'character': return '👤';
      case 'corporation': return '🏢';
      case 'alliance': return '🌐';
      default: return '❓';
    }
  };

  const filteredContacts = contacts.filter(contact => {
    switch (contactFilter) {
      case 'friendly': return contact.standing > 0;
      case 'neutral': return contact.standing === 0;
      case 'hostile': return contact.standing < 0;
      case 'watched': return contact.is_watched;
      default: return true;
    }
  });

  if (!isAuthenticated) {
    return (
      <div className="page-container">
        <div className="glass-panel" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
          <h1 className="text-hero">Communication Hub</h1>
          <p className="text-body" style={{ marginTop: 'var(--space-lg)', opacity: 0.8 }}>
            Centralized communication management for EVE Online
          </p>
          <div style={{ marginTop: 'var(--space-xl)' }}>
            <button 
              className="btn btn-primary"
              onClick={() => window.electronAPI.auth.start()}
            >
              Connect to EVE Online
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="glass-panel" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
          <h1 className="text-hero">Communication Hub</h1>
          <div style={{ marginTop: 'var(--space-xl)' }}>
            <div className="loading-spinner"></div>
            <p className="text-body" style={{ marginTop: 'var(--space-md)' }}>
              Loading mail and contacts...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="glass-panel" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
          <h1 className="text-hero">Communication Hub</h1>
          <div style={{ marginTop: 'var(--space-xl)' }}>
            <p className="text-body" style={{ color: 'var(--danger-red)', marginBottom: 'var(--space-md)' }}>
              {error}
            </p>
            <button className="btn btn-primary" onClick={loadCommunicationData}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="glass-panel" style={{ padding: 'var(--space-xl)' }}>
        {/* Header */}
        <div className="communication-hub-header" style={{ marginBottom: 'var(--space-lg)' }}>
          <h1 className="text-hero">Communication Hub</h1>
          <p className="text-body" style={{ opacity: 0.8, marginBottom: 'var(--space-lg)' }}>
            Mail and contact management for {activeCharacter?.character_name}
          </p>

          {/* Tab Navigation */}
          <div className="tab-navigation" style={{
            display: 'flex',
            gap: 'var(--space-md)',
            marginBottom: 'var(--space-lg)',
            flexWrap: 'wrap'
          }}>
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'inbox', name: 'Inbox', icon: '📧' },
              { id: 'contacts', name: 'Contacts', icon: '👥' },
              { id: 'compose', name: 'Compose', icon: '✍️' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                style={{
                  padding: 'var(--space-md)',
                  backgroundColor: selectedTab === tab.id ? 'var(--info-blue)' : 'rgba(255, 255, 255, 0.1)',
                  border: `2px solid ${selectedTab === tab.id ? 'var(--info-blue)' : 'rgba(255, 255, 255, 0.2)'}`,
                  borderRadius: '8px',
                  color: selectedTab === tab.id ? 'black' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-sm)'
                }}
              >
                <span style={{ fontSize: '18px' }}>{tab.icon}</span>
                {tab.name}
                {tab.id === 'inbox' && metrics.unreadMails > 0 && (
                  <span style={{
                    backgroundColor: 'var(--danger-red)',
                    color: 'white',
                    borderRadius: '50%',
                    padding: '2px 6px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    minWidth: '18px',
                    textAlign: 'center'
                  }}>
                    {metrics.unreadMails}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div className="overview-content">
            {/* Key Metrics Grid */}
            <div className="metrics-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 'var(--space-lg)',
              marginBottom: 'var(--space-xl)'
            }}>
              <div className="metric-card" style={{
                padding: 'var(--space-lg)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                border: '2px solid var(--info-blue)'
              }}>
                <h3 style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase', opacity: 0.7 }}>
                  Mail Messages
                </h3>
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  color: 'var(--info-blue)',
                  marginTop: 'var(--space-sm)'
                }}>
                  {metrics.totalMails}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.7, marginTop: 'var(--space-xs)' }}>
                  {metrics.unreadMails} unread messages
                </div>
              </div>

              <div className="metric-card" style={{
                padding: 'var(--space-lg)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                border: '2px solid var(--primary-cyan)'
              }}>
                <h3 style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase', opacity: 0.7 }}>
                  Total Contacts
                </h3>
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  color: 'var(--primary-cyan)',
                  marginTop: 'var(--space-sm)'
                }}>
                  {metrics.totalContacts}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.7, marginTop: 'var(--space-xs)' }}>
                  {metrics.watchedContacts} watched
                </div>
              </div>

              <div className="metric-card" style={{
                padding: 'var(--space-lg)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                border: '2px solid var(--success-green)'
              }}>
                <h3 style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase', opacity: 0.7 }}>
                  Friendly Contacts
                </h3>
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  color: 'var(--success-green)',
                  marginTop: 'var(--space-sm)'
                }}>
                  {metrics.friendlyContacts}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.7, marginTop: 'var(--space-xs)' }}>
                  {metrics.neutralContacts} neutral, {metrics.hostileContacts} hostile
                </div>
              </div>

              <div className="metric-card" style={{
                padding: 'var(--space-lg)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                border: '2px solid var(--warning-orange)'
              }}>
                <h3 style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase', opacity: 0.7 }}>
                  Recent Conversations
                </h3>
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  color: 'var(--warning-orange)',
                  marginTop: 'var(--space-sm)'
                }}>
                  {metrics.recentConversations.length}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.7, marginTop: 'var(--space-xs)' }}>
                  Active discussions
                </div>
              </div>
            </div>

            {/* Recent Conversations */}
            <div className="recent-conversations">
              <h2 className="text-h2" style={{ marginBottom: 'var(--space-md)' }}>
                💬 Recent Conversations
              </h2>
              <div className="conversations-list" style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                {metrics.recentConversations.length > 0 ? (
                  metrics.recentConversations.map((conversation, index) => (
                    <div key={conversation.contactId} style={{
                      padding: 'var(--space-md)',
                      borderBottom: index < metrics.recentConversations.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                        <span style={{ fontSize: '20px' }}>
                          {getContactTypeIcon(conversation.contactType)}
                        </span>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                            {conversation.contactName}
                          </div>
                          <div style={{ fontSize: '12px', opacity: 0.7 }}>
                            {conversation.messageCount} messages • Last: {formatDate(conversation.lastMessageDate)}
                          </div>
                        </div>
                      </div>
                      <div style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        backgroundColor: getStandingColor(conversation.standing),
                        color: 'black'
                      }}>
                        {getStandingLabel(conversation.standing)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: 'var(--space-xl)', 
                    opacity: 0.7 
                  }}>
                    No recent conversations
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Inbox Tab */}
        {selectedTab === 'inbox' && (
          <div className="inbox-content">
            <h2 className="text-h2" style={{ marginBottom: 'var(--space-md)' }}>
              📧 Mail Inbox ({metrics.totalMails} messages)
            </h2>
            <div className="mail-table-container" style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.05)', 
              borderRadius: '8px',
              overflow: 'hidden',
              maxHeight: '70vh',
              overflowY: 'auto'
            }}>
              {mails.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
                    <tr style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.2)' }}>
                      <th style={{ padding: 'var(--space-md)', textAlign: 'left', width: '60px' }}>Status</th>
                      <th style={{ padding: 'var(--space-md)', textAlign: 'left' }}>From</th>
                      <th style={{ padding: 'var(--space-md)', textAlign: 'left' }}>Subject</th>
                      <th style={{ padding: 'var(--space-md)', textAlign: 'center' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mails.map(mail => (
                      <tr key={mail.mail_id} style={{ 
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        backgroundColor: mail.is_read ? 'transparent' : 'rgba(255, 255, 255, 0.03)'
                      }}>
                        <td style={{ padding: 'var(--space-md)', textAlign: 'center' }}>
                          <span style={{
                            fontSize: '16px',
                            opacity: 0.8
                          }}>
                            {mail.is_read ? '📖' : '📧'}
                          </span>
                        </td>
                        <td style={{ padding: 'var(--space-md)' }}>
                          <div style={{ fontWeight: 'bold' }}>
                            Contact {mail.from || 'Unknown'}
                          </div>
                        </td>
                        <td style={{ padding: 'var(--space-md)' }}>
                          <div style={{ 
                            fontWeight: mail.is_read ? 'normal' : 'bold',
                            fontSize: '14px'
                          }}>
                            {mail.subject}
                          </div>
                        </td>
                        <td style={{ padding: 'var(--space-md)', textAlign: 'center', fontSize: '12px' }}>
                          {formatDate(mail.timestamp)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: 'var(--space-xl)', 
                  opacity: 0.7 
                }}>
                  No mail messages found
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contacts Tab */}
        {selectedTab === 'contacts' && (
          <div className="contacts-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
              <h2 className="text-h2">
                👥 Contacts ({filteredContacts.length})
              </h2>
              
              {/* Contact Filter */}
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                {[
                  { id: 'all', label: 'All', color: 'var(--primary-cyan)' },
                  { id: 'friendly', label: 'Friendly', color: 'var(--success-green)' },
                  { id: 'neutral', label: 'Neutral', color: 'var(--warning-orange)' },
                  { id: 'hostile', label: 'Hostile', color: 'var(--danger-red)' },
                  { id: 'watched', label: 'Watched', color: 'var(--info-blue)' }
                ].map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setContactFilter(filter.id as any)}
                    style={{
                      padding: 'var(--space-sm) var(--space-md)',
                      backgroundColor: contactFilter === filter.id ? filter.color : 'rgba(255, 255, 255, 0.1)',
                      border: `1px solid ${filter.color}`,
                      borderRadius: '4px',
                      color: contactFilter === filter.id ? 'black' : 'white',
                      cursor: 'pointer',
                      fontSize: '12px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="contacts-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 'var(--space-md)',
              maxHeight: '60vh',
              overflowY: 'auto'
            }}>
              {filteredContacts.length > 0 ? (
                filteredContacts.map(contact => (
                  <div
                    key={contact.contact_id}
                    className="contact-card"
                    style={{
                      padding: 'var(--space-md)',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: `2px solid ${getStandingColor(contact.standing)}`,
                      borderRadius: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-sm)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <span style={{ fontSize: '20px' }}>
                          {getContactTypeIcon(contact.contact_type)}
                        </span>
                        <h4 style={{ margin: 0, color: 'var(--primary-cyan)', fontSize: '16px' }}>
                          Contact {contact.contact_id}
                        </h4>
                      </div>
                      <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                        {contact.is_watched && (
                          <span style={{ fontSize: '14px', opacity: 0.8 }}>👁️</span>
                        )}
                        {contact.is_blocked && (
                          <span style={{ fontSize: '14px', opacity: 0.8 }}>🚫</span>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: 'var(--space-md)' }}>
                      {contact.contact_type.charAt(0).toUpperCase() + contact.contact_type.slice(1)}
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        backgroundColor: getStandingColor(contact.standing),
                        color: 'black'
                      }}>
                        {getStandingLabel(contact.standing)} ({contact.standing.toFixed(1)})
                      </div>
                      <button 
                        className="btn btn-secondary" 
                        style={{ fontSize: '11px', padding: '4px 8px' }}
                        onClick={() => {
                          // Open conversation with this contact
                          console.log('Open conversation with:', contact.contact_id);
                        }}
                      >
                        Message
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ 
                  gridColumn: '1 / -1',
                  textAlign: 'center', 
                  padding: 'var(--space-xl)', 
                  opacity: 0.7 
                }}>
                  No contacts found for the selected filter
                </div>
              )}
            </div>
          </div>
        )}

        {/* Compose Tab */}
        {selectedTab === 'compose' && (
          <div className="compose-content">
            <h2 className="text-h2" style={{ marginBottom: 'var(--space-md)' }}>
              ✍️ Compose New Message
            </h2>
            <div className="compose-form" style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              padding: 'var(--space-lg)'
            }}>
              <div style={{ marginBottom: 'var(--space-md)' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 'var(--space-sm)', 
                  fontSize: '14px', 
                  fontWeight: 'bold' 
                }}>
                  To:
                </label>
                <input
                  type="text"
                  placeholder="Character, Corporation, or Alliance name"
                  style={{
                    width: '100%',
                    padding: 'var(--space-md)',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '4px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: 'var(--space-md)' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 'var(--space-sm)', 
                  fontSize: '14px', 
                  fontWeight: 'bold' 
                }}>
                  Subject:
                </label>
                <input
                  type="text"
                  placeholder="Message subject"
                  style={{
                    width: '100%',
                    padding: 'var(--space-md)',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '4px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: 'var(--space-lg)' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 'var(--space-sm)', 
                  fontSize: '14px', 
                  fontWeight: 'bold' 
                }}>
                  Message:
                </label>
                <textarea
                  placeholder="Type your message here..."
                  rows={8}
                  style={{
                    width: '100%',
                    padding: 'var(--space-md)',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '4px',
                    color: 'white',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    // Send message functionality
                    console.log('Send message');
                  }}
                >
                  Send Message
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    // Save draft functionality
                    console.log('Save draft');
                  }}
                >
                  Save Draft
                </button>
              </div>
              
              <div style={{
                marginTop: 'var(--space-md)',
                padding: 'var(--space-md)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '4px',
                fontSize: '12px',
                opacity: 0.7
              }}>
                📝 Note: This is a read-only demo. Actual message sending requires write permissions in ESI.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunicationHub;