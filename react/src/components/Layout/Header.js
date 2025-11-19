import React, { useState, useRef } from 'react';
import { AppBar, AppBarSection, AppBarSpacer } from '@progress/kendo-react-layout';
import { Button } from '@progress/kendo-react-buttons';
import { Badge, BadgeContainer } from '@progress/kendo-react-indicators';
import { Popup } from '@progress/kendo-react-popup';
import { FaBell, FaUserCircle, FaUser, FaCog, FaSignOutAlt, FaChevronDown } from 'react-icons/fa';

const Header = ({ onMenuClick, expanded }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userButtonRef = useRef(null);

  const handleUserMenuClick = () => {
    setShowUserMenu(!showUserMenu);
  };

  const handleClickOutside = (event) => {
    if (userButtonRef.current && !userButtonRef.current.contains(event.target)) {
      setShowUserMenu(false);
    }
  };

  React.useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <AppBar className="header">
      <AppBarSection className="left-section">
        <Button 
          className="hamburger-button"
          onClick={onMenuClick}
          look="flat"
        >
          <div className={`hamburger-icon ${expanded ? 'open' : ''}`}>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </div>
        </Button>

        <h2 className="app-title">Accounting System</h2>
                </AppBarSection>

                <AppBarSpacer />

      <AppBarSection className="right-section">
        <div className="notification-wrapper">
          <Button 
            className="notification-button"
            look="flat"
          >
            <FaBell className="notification-icon" />
            <Badge className="notification-badge" themeColor="info" size="small" />
          </Button>
        </div>

        <div className="divider"></div>

        <div className="user-section" ref={userButtonRef}>
          <Button
            className="user-button"
            look="flat"
            onClick={handleUserMenuClick}
          >
            <div className="user-info">
              <div className="user-avatar">
                <FaUserCircle />
              </div>
              <span className="user-name">Admin</span>
              <FaChevronDown className={`dropdown-arrow ${showUserMenu ? 'open' : ''}`} />
            </div>
                    </Button>
          
          <Popup
            show={showUserMenu}
            anchor={userButtonRef.current}
            popupClass="user-popup"
            animate={false}
            position="bottom"
            align={{
              horizontal: "right",
              vertical: "top"
            }}
            offset={{
              left: 0,
              top: 5
            }}
          >
            <div className="popup-content">
              <div className="popup-header">
                <div className="popup-avatar">
                  <FaUserCircle />
                </div>
                <div className="popup-user-info">
                  <span className="popup-user-name">Admin</span>
                  <span className="popup-user-email">admin@example.com</span>
                </div>
                    </div>
              <div className="menu-separator"></div>
              <ul className="popup-menu">
                                    <li>
                  <Button look="flat" className="menu-item">
                    <FaUser className="menu-icon" />
                    <span>My Profile</span>
                  </Button>
                                    </li>
                                    <li>
                  <Button look="flat" className="menu-item">
                    <FaCog className="menu-icon" />
                    <span>Settings</span>
                  </Button>
                                    </li>
                <li className="menu-separator"></li>
                                    <li>
                  <Button look="flat" className="menu-item menu-item-danger">
                    <FaSignOutAlt className="menu-icon" />
                    <span>Sign Out</span>
                  </Button>
                                    </li>
                                </ul>
                            </div>
          </Popup>
        </div>
                </AppBarSection>

      <style>{`
        .header {
          background-color: #1976d2;
          padding: 0 16px;
          height: 60px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
        }

        .left-section {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .right-section {
          display: flex;
          align-items: center;
          gap: 8px;
          position: relative;
        }

        .hamburger-button {
          color: white !important;
          background: transparent !important;
          border: none !important;
          padding: 8px !important;
          height: 40px;
          width: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
        }

        .hamburger-button:hover {
          background-color: rgba(255,255,255,0.1) !important;
        }

        .app-title {
          color: white;
          font-size: 15px;
          font-weight: 500;
          margin: 0;
        }

        .notification-wrapper {
          position: relative;
        }

        .notification-button {
          color: white !important;
          background: transparent !important;
          border: none !important;
          padding: 8px !important;
          height: 40px;
          width: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
        }

        .notification-button:hover {
          background-color: rgba(255,255,255,0.1) !important;
        }

        .notification-icon {
          font-size: 16px;
        }

        .notification-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 8px;
          height: 8px;
          background-color: #38b2ac;
          border: 2px solid #1976d2;
          border-radius: 50%;
        }

        .divider {
          width: 1px;
          height: 24px;
          background-color: rgba(255,255,255,0.2);
          margin: 0 8px;
        }

        .user-section {
          position: relative;
          height: 40px;
          display: flex;
          align-items: center;
        }

        .user-button {
          color: white !important;
          background: transparent !important;
          border: none !important;
          padding: 6px 12px !important;
          height: 40px;
          display: flex;
          align-items: center;
          border-radius: 4px;
          min-width: 160px;
          transition: background-color 0.2s ease;
          position: relative;
        }

        .user-button:hover {
          background-color: rgba(255,255,255,0.1) !important;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
        }

        .user-avatar {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          color: white;
          flex-shrink: 0;
        }

        .user-name {
          font-size: 13px;
          font-weight: 500;
          color: white;
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .dropdown-arrow {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.8);
          margin-left: 4px;
          transform: rotate(0deg);
          transition: transform 0.2s ease;
        }

        .dropdown-arrow.open {
          transform: rotate(180deg);
        }

        .user-popup {
          position: absolute !important;
          right: 0 !important;
          top: 100% !important;
          margin-top: 8px;
          z-index: 9999;
        }

        .popup-content {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.2);
          min-width: 240px;
          max-width: 280px;
          width: 100%;
          padding: 0;
          border: 1px solid rgba(0,0,0,0.08);
          overflow: hidden;
        }

        .popup-header {
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          background-color: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .popup-avatar {
          width: 40px;
          height: 40px;
          font-size: 40px;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .popup-user-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
          min-width: 0;
        }

        .popup-user-name {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .popup-user-email {
          font-size: 12px;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .popup-menu {
          list-style: none;
          margin: 0;
          padding: 8px;
        }

        .popup-menu li {
          margin: 2px 0;
        }

        .menu-item {
          width: 100%;
          text-align: left;
          padding: 8px 12px !important;
          font-size: 13px;
          color: #2d3748 !important;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .menu-item:hover {
          background-color: #f1f5f9 !important;
        }

        .menu-item-danger {
          color: #dc2626 !important;
        }

        .menu-item-danger:hover {
          background-color: #fef2f2 !important;
        }

        .menu-icon {
          font-size: 14px;
          opacity: 0.8;
          width: 16px;
          text-align: center;
        }

        .menu-separator {
          height: 1px;
          background-color: #e2e8f0;
          margin: 8px 0;
        }

        /* Only target the user popup inside the header */
        .user-popup .k-popup,
        .user-popup .k-animation-container {
          position: absolute !important;
          right: 0 !important;
          left: auto !important;
          transform: none !important;
          z-index: 9999;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .user-button {
            min-width: auto;
            padding: 6px !important;
          }

          .user-info {
            justify-content: center;
          }

          .user-name, .dropdown-arrow {
            display: none;
          }

          .user-avatar {
            margin: 0;
          }
        }
      `}</style>
    </AppBar>
  );
};

export default Header; 