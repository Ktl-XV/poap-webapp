import React from 'react';
import { Link } from 'react-router-dom';

type TokenSmallProps = {
  tokenId: string | undefined;
  name: string;
  image: string;
};

const TokenSmall: React.FC<TokenSmallProps> = ({ tokenId, name, image }) => {
  return (
    <Link
      to={{
        pathname: `/token/${tokenId}`,
        state: tokenId,
      }}
      className="event-circle"
      data-aos="fade-up"
    >
      <img src={image} alt={name} />
    </Link>
  );
};
export default TokenSmall;
