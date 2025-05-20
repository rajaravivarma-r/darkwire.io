import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';

import { Chat } from '@/components/Chat/Chat';

import * as dom from '@/utils/dom';

const translations = {
  typePlaceholder: 'inputplaceholder',
};

// Fake date
vi.spyOn(global.Date, 'now').mockImplementation(() => new Date('2020-03-14T11:01:58.135Z').valueOf());

// To change touch support
vi.mock('@/utils/dom');

describe('Chat component', () => {
  afterEach(() => {
    // Reset touch support
    dom.hasTouchSupport = false;
  });

  it('should display', () => {
    const { asFragment } = render(
      <Chat
        scrollToBottom={() => {}}
        focusChat={false}
        userId="foo"
        username="user"
        showNotice={() => {}}
        clearActivities={() => {}}
        sendEncryptedMessage={() => {}}
        translations={{}}
      />,
    );

    expect(asFragment()).toMatchSnapshot();
  });

  it('can send message', () => {
    const sendEncryptedMessage = vi.fn();

    render(
      <Chat
        scrollToBottom={() => {}}
        focusChat={false}
        userId="foo"
        username="user"
        showNotice={() => {}}
        clearActivities={() => {}}
        sendEncryptedMessage={sendEncryptedMessage}
        translations={translations}
      />,
    );

    const textarea = screen.getByPlaceholderText(translations.typePlaceholder);

    // Validate but without text
    fireEvent.keyDown(textarea, { key: 'Enter' });

    expect(sendEncryptedMessage).not.toHaveBeenCalled();

    // Type test
    fireEvent.change(textarea, { target: { value: 'test' } });
    // Validate
    fireEvent.keyDown(textarea, { key: 'Enter' });

    expect(sendEncryptedMessage).toHaveBeenLastCalledWith({
      payload: { text: 'test', timestamp: 1584183718135 },
      type: 'TEXT_MESSAGE',
    });

    // Validate (textarea should be empty)
    fireEvent.keyDown(textarea, { key: 'Enter' });

    expect(sendEncryptedMessage).toHaveBeenCalledTimes(1);
  });

  it("shouldn't send message with Shift+enter", () => {
    const sendEncryptedMessage = vi.fn();

    render(
      <Chat
        scrollToBottom={() => {}}
        focusChat={false}
        userId="foo"
        username="user"
        showNotice={() => {}}
        clearActivities={() => {}}
        sendEncryptedMessage={sendEncryptedMessage}
        translations={translations}
      />,
    );

    const textarea = screen.getByPlaceholderText(translations.typePlaceholder);

    // Test shift effect
    fireEvent.change(textarea, { target: { value: 'test2' } });
    fireEvent.keyDown(textarea, { key: 'Shift' });
    fireEvent.keyDown(textarea, { key: 'Enter' });
    fireEvent.keyUp(textarea, { key: 'Shift' });

    expect(sendEncryptedMessage).toHaveBeenCalledTimes(0);

    // Now we want to send the message
    fireEvent.keyDown(textarea, { key: 'Enter' });

    expect(sendEncryptedMessage).toHaveBeenCalledTimes(1);

    expect(sendEncryptedMessage).toHaveBeenLastCalledWith({
      payload: { text: 'test2', timestamp: 1584183718135 },
      type: 'TEXT_MESSAGE',
    });
  });

  it('should send commands', () => {
    const sendEncryptedMessage = vi.fn();
    const showNotice = vi.fn();
    const clearActivities = vi.fn();

    render(
      <Chat
        scrollToBottom={() => {}}
        focusChat={false}
        userId="foo"
        username="user"
        showNotice={showNotice}
        clearActivities={clearActivities}
        sendEncryptedMessage={sendEncryptedMessage}
        translations={translations}
      />,
    );

    const textarea = screen.getByPlaceholderText(translations.typePlaceholder);

    // Test /help
    fireEvent.change(textarea, { target: { value: '/help' } });
    fireEvent.keyDown(textarea, { key: 'Enter' });

    expect(showNotice).toHaveBeenLastCalledWith({
      level: 'info',
      message: 'Valid commands: /clear, /help, /me, /nick',
    });

    // Test /me
    fireEvent.change(textarea, { target: { value: '/me' } });
    fireEvent.keyDown(textarea, { key: 'Enter' });

    expect(sendEncryptedMessage).not.toHaveBeenCalled();

    fireEvent.change(textarea, { target: { value: '/me action' } });
    fireEvent.keyDown(textarea, { key: 'Enter' });

    expect(sendEncryptedMessage).toHaveBeenLastCalledWith({
      payload: { action: 'action' },
      type: 'USER_ACTION',
    });

    // Test /clear
    fireEvent.change(textarea, { target: { value: '/clear' } });
    fireEvent.keyDown(textarea, { key: 'Enter' });

    expect(clearActivities).toHaveBeenLastCalledWith();

    // Test /nick/clear
    fireEvent.change(textarea, { target: { value: '/nick john!Th3Ripp&3r' } });
    fireEvent.keyDown(textarea, { key: 'Enter' });

    expect(sendEncryptedMessage).toHaveBeenLastCalledWith({
      payload: { currentUsername: 'user', id: 'foo', newUsername: 'john-Th3Ripp-3r' },
      type: 'CHANGE_USERNAME',
    });

    // Test /nick
    fireEvent.change(textarea, { target: { value: '/nick' } });
    fireEvent.keyDown(textarea, { key: 'Enter' });

    expect(showNotice).toHaveBeenLastCalledWith({
      level: 'error',
      message: 'Username cannot be blank, Username must start with a letter',
    });

    // Test /nick
    fireEvent.change(textarea, { target: { value: '/nick 3po' } });
    fireEvent.keyDown(textarea, { key: 'Enter' });

    expect(showNotice).toHaveBeenLastCalledWith({
      level: 'error',
      message: 'Username must start with a letter',
    });

    // Test /nick
    fireEvent.change(textarea, {
      target: { value: '/nick 3po3ralotsofcrapscharactersforyourpleasureandnotmine' },
    });
    fireEvent.keyDown(textarea, { key: 'Enter' });

    expect(sendEncryptedMessage).toHaveBeenLastCalledWith({
      payload: { currentUsername: 'user', id: 'foo', newUsername: 'john-Th3Ripp-3r' },
      type: 'CHANGE_USERNAME',
    });

    // Test badcommand
    fireEvent.change(textarea, { target: { value: '/void' } });
    fireEvent.keyDown(textarea, { key: 'Enter' });
  });

  it('should work with touch support', async () => {
    // Enable touch support
    dom.hasTouchSupport = true;

    vi.mock('@/utils/dom', () => {
      return {
        getSelectedText: vi.fn(),
        hasTouchSupport: true,
      };
    });

    const sendEncryptedMessage = vi.fn();

    const { getByTitle } = render(
      <Chat
        scrollToBottom={() => {}}
        focusChat={false}
        userId="foo"
        username="user"
        showNotice={() => {}}
        clearActivities={() => {}}
        sendEncryptedMessage={sendEncryptedMessage}
        translations={translations}
      />,
    );

    const textarea = screen.getByPlaceholderText(translations.typePlaceholder);

    // Type test
    fireEvent.change(textarea, { target: { value: 'test' } });

    // Touch send button
    await fireEvent.click(getByTitle('Send'));

    expect(sendEncryptedMessage).toHaveBeenLastCalledWith({
      payload: { text: 'test', timestamp: 1584183718135 },
      type: 'TEXT_MESSAGE',
    });

    // Should not send message because of the empty message
    await fireEvent.click(getByTitle('Send'));

    expect(sendEncryptedMessage).toHaveBeenCalledTimes(1);
  });
});
import React from 'react';
import { render, fireEvent, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Chat } from './Chat';

describe('Chat component', () => {
  const baseProps = {
    sendEncryptedMessage: jest.fn(),
    sendUnencryptedFile: jest.fn(),
    showNotice: jest.fn(),
    userId: 'user1',
    username: 'Alice',
    clearActivities: jest.fn(),
    focusChat: false,
    scrollToBottom: jest.fn(),
    translations: { typePlaceholder: 'Type a message...' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders textarea and buttons', () => {
    render(<Chat {...baseProps} />);
    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
    expect(screen.getByTitle('Send unencrypted media')).toBeInTheDocument();
  });

  it('calls sendEncryptedMessage on Enter (desktop)', () => {
    render(<Chat {...baseProps} />);
    const textarea = screen.getByPlaceholderText('Type a message...');
    fireEvent.change(textarea, { target: { value: 'hello' } });
    fireEvent.keyDown(textarea, { key: 'Enter', code: 13, shiftKey: false, ctrlKey: false, metaKey: false });
    expect(baseProps.sendEncryptedMessage).toHaveBeenCalled();
  });

  it('calls sendEncryptedMessage on Ctrl+Enter', () => {
    render(<Chat {...baseProps} />);
    const textarea = screen.getByPlaceholderText('Type a message...');
    fireEvent.change(textarea, { target: { value: 'hello' } });
    fireEvent.keyDown(textarea, { key: 'Enter', code: 13, ctrlKey: true });
    expect(baseProps.sendEncryptedMessage).toHaveBeenCalled();
  });

  it('calls sendUnencryptedFile when file is selected', async () => {
    render(<Chat {...baseProps} />);
    const file = new File(['abc'], 'test.png', { type: 'image/png' });
    const input = screen.getByLabelText('', { selector: 'input[type="file"]' });
    // Mock FileReader
    const readAsArrayBuffer = jest.fn();
    const addEventListener = jest.fn((_, cb) => cb({ target: { result: new Uint8Array([97, 98, 99]).buffer } }));
    window.FileReader = jest.fn(() => ({
      readAsArrayBuffer,
      addEventListener,
      onload: null,
      onerror: null,
      result: null,
      readAsDataURL: jest.fn(),
      readAsText: jest.fn(),
      readAsBinaryString: jest.fn(),
      readAsArrayBuffer: function(buffer) {
        this.onload({ target: { result: buffer } });
      },
    }));
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });
    expect(baseProps.sendUnencryptedFile).toHaveBeenCalled();
  });

  it('shows error for invalid /nick command', () => {
    render(<Chat {...baseProps} />);
    const textarea = screen.getByPlaceholderText('Type a message...');
    fireEvent.change(textarea, { target: { value: '/nick 123456789012345678901' } });
    fireEvent.keyDown(textarea, { key: 'Enter', code: 13, ctrlKey: true });
    expect(baseProps.showNotice).toHaveBeenCalled();
  });
});
