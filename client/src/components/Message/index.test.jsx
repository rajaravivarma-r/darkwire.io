import React from 'react';
import { render, screen } from '@testing-library/react';
import Message from './index';

describe('Message component', () => {
  it('renders text message', () => {
    render(<Message message="hello" timestamp={Date.now()} sender="Alice" />);
    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('renders unencrypted image', () => {
    render(
      <Message
        type="RECEIVE_UNENCRYPTED_FILE"
        fileType="image/png"
        fileName="pic.png"
        encodedFile="iVBORw0KGgoAAAANSUhEUgAAAAUA"
        timestamp={Date.now()}
        sender="Bob"
      />
    );
    expect(screen.getByAltText('pic.png')).toBeInTheDocument();
  });

  it('renders unencrypted video', () => {
    render(
      <Message
        type="RECEIVE_UNENCRYPTED_FILE"
        fileType="video/mp4"
        fileName="vid.mp4"
        encodedFile="AAAA"
        timestamp={Date.now()}
        sender="Bob"
      />
    );
    expect(screen.getByText('Your browser does not support the video tag.')).toBeInTheDocument();
  });

  it('renders unencrypted file as link if not image/video', () => {
    render(
      <Message
        type="RECEIVE_UNENCRYPTED_FILE"
        fileType="application/pdf"
        fileName="file.pdf"
        encodedFile="AAAA"
        timestamp={Date.now()}
        sender="Bob"
      />
    );
    expect(screen.getByText('file.pdf')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('download', 'file.pdf');
  });
});
