import React from 'react';
import FooterCover from '../images/footer.svg';
import PoapLogo from '../images/POAP.svg';
import TwitterLogo from '../images/twitter.svg';
import GithubLogo from '../images/github.svg';
import TelegramLogo from '../images/telegram.svg';
import DiscordLogo from '../images/discord.svg';
import RedditLogo from '../images/reddit.svg';

type FooterProps = {
  path: string;
};

const Footer: React.FC<FooterProps> = ({ path }) => (
  <footer>
    <img src={FooterCover} className={'cover'} alt={'footer cover'} />
    <div className={'footer-container'}>
      <img src={PoapLogo} alt={'POAP Logo'} className={'footer-logo'} />
      <p className="footer-text">Join our community!</p>
      <div className="footer-communities">
        <a href="https://twitter.com/poapxyz/" target="_blank" rel="noopener noreferrer">
          <img src={TwitterLogo} alt={'twitter logo'} />
        </a>
        <a href="https://github.com/poapxyz/poap" target="_blank" rel="noopener noreferrer">
          <img src={GithubLogo} alt={'github logo'} />
        </a>
        <a href="https://t.me/poapxyz" target="_blank" rel="noopener noreferrer">
          <img src={TelegramLogo} alt={'telegram logo'} />
        </a>
        <a href="https://discord.gg/fcxW4yR" target="_blank" rel="noopener noreferrer">
          <img src={DiscordLogo} alt={'discord logo'} />
        </a>
        <a href="https://reddit.com/r/poap" target="_blank" rel="noopener noreferrer">
          <img src={RedditLogo} alt={'reddit logo'} />
        </a>
      </div>
    </div>
  </footer>
);

export default Footer;
