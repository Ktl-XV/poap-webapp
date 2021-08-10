import React from 'react';
import { Link } from 'react-router-dom';
import PoapLogo from '../images/POAP.svg';

type ScanHeaderProps = {
  sectionName: string;
};

const Header: React.FC<ScanHeaderProps> = ({ sectionName }) => (
  <header id="site-header" role="banner">
    <div className="container">
      <div className="pull-left">
        <Link to="/" className="logo">
          <img src={PoapLogo} alt="POAP" />
        </Link>
        <span>{sectionName}</span>
      </div>
      <div style={{ marginLeft: 'auto' }}>
        {/* Ready for future links if needed */}
        {/* <Link to="#" className="link">FAQ</Link> */}
      </div>
    </div>
  </header>
);

export default Header;
