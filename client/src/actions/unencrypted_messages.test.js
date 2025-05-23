import * as actions from './unencrypted_messages';

import { describe, it, expect, vi } from 'vitest';

const mockEmit = vi.fn((_type, _null, callback) => {
  callback({ isLocked: true });
});

vi.mock('@/utils/socket', () => {
  return {
    getSocket: vi.fn().mockImplementation(() => ({
      emit: mockEmit,
    })),
  };
});

describe('Receive unencrypted message actions', () => {
  it('should create no action', () => {
    const mockDispatch = vi.fn();
    actions.receiveUnencryptedMessage('FAKE')(mockDispatch, vi.fn().mockReturnValue({}));
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('should create user enter action', () => {
    const mockDispatch = vi.fn();
    actions.receiveUnencryptedMessage('USER_ENTER', 'test')(mockDispatch, vi.fn().mockReturnValue({ state: {} }));
    expect(mockDispatch).toHaveBeenLastCalledWith({ type: 'USER_ENTER', payload: 'test' });
  });

  it('should create user exit action', () => {
    const mockDispatch = vi.fn();
    const state = {
      room: {
        members: [
          { publicKey: { n: 'alankey' }, id: 'alankey', username: 'alan' },
          { publicKey: { n: 'dankey' }, id: 'dankey', username: 'dan' },
          { publicKey: { n: 'alicekey' }, id: 'alicekey', username: 'dan' },
        ],
      },
    };
    const mockGetState = vi.fn().mockReturnValue(state);
    const payload1 = [
      { publicKey: { n: 'alankey' } },
      { publicKey: { n: 'dankey' } },
      { publicKey: { n: 'alicekey' } },
    ];
    const payload2 = [{ publicKey: { n: 'dankey' } }, { publicKey: { n: 'alicekey' } }];

    // Nobody left
    actions.receiveUnencryptedMessage('USER_EXIT', payload1)(mockDispatch, mockGetState);

    expect(mockDispatch).not.toHaveBeenCalled();

    actions.receiveUnencryptedMessage('USER_EXIT', payload2)(mockDispatch, mockGetState);
    expect(mockDispatch).toHaveBeenLastCalledWith({
      payload: {
        id: 'alankey',
        members: [{ publicKey: { n: 'dankey' } }, { publicKey: { n: 'alicekey' } }],
        username: 'alan',
      },
      type: 'USER_EXIT',
    });
  });

  it('should create receive toggle lock room action', () => {
    const mockDispatch = vi.fn();
    const state = {
      room: {
        members: [
          { publicKey: { n: 'alankey' }, id: 'idalan', username: 'alan' },
          { publicKey: { n: 'dankey' }, id: 'iddan', username: 'dan' },
        ],
      },
    };
    const mockGetState = vi.fn().mockReturnValue(state);
    const payload = { publicKey: { n: 'alankey' } };

    actions.receiveUnencryptedMessage('TOGGLE_LOCK_ROOM', payload)(mockDispatch, mockGetState);
    expect(mockDispatch).toHaveBeenLastCalledWith({
      payload: { id: 'idalan', locked: undefined, username: 'alan' },
      type: 'RECEIVE_TOGGLE_LOCK_ROOM',
    });
  });

  it('should create receive toggle lock room action', () => {
    const mockDispatch = vi.fn();
    const state = {
      user: {
        username: 'alan',
        id: 'idalan',
      },
    };
    const mockGetState = vi.fn().mockReturnValue(state);

    actions.sendUnencryptedMessage('TOGGLE_LOCK_ROOM')(mockDispatch, mockGetState);
    expect(mockDispatch).toHaveBeenLastCalledWith({
      payload: { locked: true, sender: 'idalan', username: 'alan' },
      type: 'TOGGLE_LOCK_ROOM',
    });
  });
});

describe('Send unencrypted message actions', () => {
  it('should create no action', () => {
    const mockDispatch = vi.fn();
    actions.sendUnencryptedMessage('FAKE')(mockDispatch, vi.fn().mockReturnValue({}));
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('should create toggle lock room action', () => {
    const mockDispatch = vi.fn();
    const state = {
      user: {
        username: 'alan',
        id: 'idalan',
      },
    };
    const mockGetState = vi.fn().mockReturnValue(state);

    actions.sendUnencryptedMessage('TOGGLE_LOCK_ROOM')(mockDispatch, mockGetState);
    expect(mockDispatch).toHaveBeenLastCalledWith({
      payload: { locked: true, sender: 'idalan', username: 'alan' },
      type: 'TOGGLE_LOCK_ROOM',
    });
  });
});
import { sendUnencryptedFile, receiveUnencryptedMessage } from './unencrypted_messages';

describe('unencrypted_messages actions', () => {
  let dispatch, getState, socketEmit;

  beforeEach(() => {
    dispatch = jest.fn();
    getState = () => ({
      user: { username: 'Alice', id: 'user1' },
      room: { members: [{ publicKey: { n: 'n1' }, username: 'Alice', id: 'user1' }] },
    });
    socketEmit = jest.fn();
    jest.mock('@/utils/socket', () => ({
      getSocket: () => ({ emit: socketEmit }),
    }));
  });

  it('sendUnencryptedFile dispatches SEND_UNENCRYPTED_FILE', async () => {
    const fileObj = { encodedFile: 'abc', fileName: 'f.png', fileType: 'image/png' };
    await sendUnencryptedFile(fileObj)(dispatch, getState);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SEND_UNENCRYPTED_FILE', payload: expect.objectContaining(fileObj) })
    );
  });

  it('receiveUnencryptedMessage dispatches RECEIVE_UNENCRYPTED_FILE', async () => {
    await receiveUnencryptedMessage('RECEIVE_UNENCRYPTED_FILE', { foo: 1 })(dispatch, getState);
    expect(dispatch).toHaveBeenCalledWith({ type: 'RECEIVE_UNENCRYPTED_FILE', payload: { foo: 1 } });
  });

  it('receiveUnencryptedMessage handles USER_ENTER', async () => {
    await receiveUnencryptedMessage('USER_ENTER', { publicKey: { n: 'n1' } })(dispatch, getState);
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'USER_ENTER' }));
  });

  it('receiveUnencryptedMessage handles USER_EXIT', async () => {
    const state = {
      ...getState(),
      room: { members: [{ publicKey: { n: 'n1' }, username: 'Alice', id: 'user1' }, { publicKey: { n: 'n2' }, username: 'Bob', id: 'user2' }] }
    };
    const payload = [{ publicKey: { n: 'n1' }, username: 'Alice', id: 'user1' }];
    await receiveUnencryptedMessage('USER_EXIT', payload)(dispatch, () => state);
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'USER_EXIT' }));
  });
});
