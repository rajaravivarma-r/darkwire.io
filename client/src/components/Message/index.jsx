import PropTypes from 'prop-types';
import moment from 'moment';
import Linkify from 'react-linkify';

import Username from '@/components/Username';

const Message = ({ message, timestamp, sender, type, fileName, fileType, encodedFile }) => {
  // If this is an unencrypted file message, render the file
  if (type === 'RECEIVE_UNENCRYPTED_FILE' || type === 'SEND_UNENCRYPTED_FILE') {
    let media = null;
    const src = encodedFile
      ? `data:${fileType};base64,${encodedFile}`
      : null;

    if (fileType && fileType.startsWith('image/')) {
      media = <img src={src} alt={fileName} style={{ maxWidth: '300px', maxHeight: '300px' }} />;
    } else if (fileType === 'video/mp4') {
      media = (
        <video controls style={{ maxWidth: '300px', maxHeight: '300px' }}>
          <source src={src} type={fileType} />
          Your browser does not support the video tag.
        </video>
      );
    } else {
      media = (
        <a href={src} download={fileName}>
          {fileName}
        </a>
      );
    }

    return (
      <div>
        <div className="chat-meta">
          <Username username={sender} />
          <span className="muted timestamp">{moment(timestamp).format('LT')}</span>
        </div>
        <div className="chat">{media}</div>
      </div>
    );
  }

  // Default: text message
  const msg = decodeURI(message);

  return (
    <div>
      <div className="chat-meta">
        <Username username={sender} />
        <span className="muted timestamp">{moment(timestamp).format('LT')}</span>
      </div>
      <div className="chat">
        <Linkify
          properties={{
            target: '_blank',
            rel: 'noopener noreferrer',
          }}
        >
          {msg}
        </Linkify>
      </div>
    </div>
  );
};

Message.propTypes = {
  sender: PropTypes.string.isRequired,
  timestamp: PropTypes.number.isRequired,
  message: PropTypes.string,
  type: PropTypes.string,
  fileName: PropTypes.string,
  fileType: PropTypes.string,
  encodedFile: PropTypes.string,
};

export default Message;
