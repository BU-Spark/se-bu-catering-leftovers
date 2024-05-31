"use client";

import React, { useState } from 'react';
import styled from 'styled-components';

const Nav = styled.nav`
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #fff;
    padding: 20px 20px;
    height: 100px;
    width: 100%;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1000;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;
const Logo = styled.div`
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%,-50%);
    z-index: 10;
`;

const LogoImage = styled.img`
    height: auto;
    max-height: 100px;
    width: auto;
`;

const MenuIcon = styled.img`
    width: 30px;
    height: 30px;
    cursor: pointer;
`;

const MenuItems = styled.div`
    background-color: #fff;
    display: ${props => props.show ? 'block' : 'none'};
    position: absolute;
    left: 0;
    top: 100%;
    width: 100%;
    box-shadow: 0 4px 8px rgba(0,0,0,0.25);
    z-index: 999;
    border-top: 2px solid #ab0101;
    border-bottom: 2px solid #ab0101;
`;

const MenuItem = styled.a`
    display: block;
    padding: 10px 20px;
    text-decoration: none;
    color: #ab0101;

    &:hover {
        background-color: #d5d2d2;
    }
`;

const Navbar = () => {
    const [showMenu, setShowMenu] = useState(false);

    const toggleMenu = () => {
        setShowMenu(!showMenu);
    };

    return (
        <Nav>
            <Logo>
                <LogoImage src="/bu-logo.png" alt="Boston University Logo" />
            </Logo>
            <MenuIcon src="hamburger-icon.png" alt="Menu" onClick={toggleMenu} />
            <MenuItems show={showMenu}>
                <MenuItem href="/">Home</MenuItem>
                <MenuItem href="/account">My Account</MenuItem>
                <MenuItem href="/terms">Terms and Conditions</MenuItem>
                <MenuItem href="/faq">FAQ</MenuItem>
                <MenuItem href="/logout">Logout</MenuItem>
            </MenuItems>
        </Nav>
    );
};

export default Navbar;