import { getMessages, saveMessages, updateMessage, removeMessage, addMessage } from '../../data/messagesStore';
describe('local demonstration messages', () => {
  it('provides safe demo records and supports local CRUD', () => {
    expect(getMessages()).toHaveLength(2);
    updateMessage('welcome', { read: true, archived: true });
    expect(getMessages()[0]).toMatchObject({ read: true, archived: true });
    addMessage({ from: 'Demo', to: 'Demo contact', subject: 'Draft', body: 'Fictional text' });
    expect(getMessages()[0]).toMatchObject({ subject: 'Draft', read: true });
    removeMessage(getMessages()[0].id); expect(getMessages()).toHaveLength(2);
    saveMessages([]); expect(getMessages()).toEqual([]);
  });
  it('tolerates malformed values and filters invalid records', () => {
    for (const value of ['{broken', '{}', '[null,{}, {"id":3}]']) {
      localStorage.setItem('careconnect_demo_messages', value); expect(getMessages()).toEqual([]);
    }
  });
});
