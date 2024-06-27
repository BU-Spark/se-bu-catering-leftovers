"use client";

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/navigation';
import MenuIcon from '@mui/icons-material/Menu';
import IconButton from '@mui/material/IconButton';

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
    z-index: 100000;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    @media (max-width: 768px) {
        padding: 15px 30px;
        height: 80px;
    }

    @media (max-width: 480px) {
        padding: 10px 20px;
        height: 80px;
    }
`;

const Logo = styled.div`
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-35%, -50%);
    z-index: 10;
`;

const LogoImage = styled.img`
    height: auto;
    max-height: 100px;
    width: auto;

    @media (max-width: 768px) {
        width: 70%;
    }

    @media (max-width: 480px) {
        width: 70%;
    }
`;

const MenuItems = styled.div`
    background-color: #fff;
    display: none;
    position: absolute;
    left: 0;
    top: 100%;
    width: 100%;
    text-decoration: none;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.25);
    z-index: 999;
    border-top: 2px solid #ab0101;
    border-bottom: 2px solid #ab0101;

    &.show {
        display: block;
    }
`;

const MenuItem = styled.div`
    display: block;
    padding: 10px 20px;
    text-decoration: none;
    color: #ab0101;
    font-family: 'Arial', sans-serif;
    font-weight: bold;
    cursor: pointer;

    &:hover {
        background-color: #d5d2d2;
    }
`;

const Navbar = ({ user = false }: { user?: boolean }) => {
    const [showMenu, setShowMenu] = useState(false);
    const router = useRouter();

    const toggleMenu = () => {
        setShowMenu(!showMenu);
    };

    const handleNavigation = (path: string) => {
        setShowMenu(false);
        router.push(path);
    };

    useEffect(() => {
        console.log('Navbar user prop:', user);
    }, [user]);

    return (
        <Nav>
            <Logo>
                <LogoImage src="/bu-logo.png" alt="Boston University Logo" />
            </Logo>
            <IconButton onClick={toggleMenu}>
                <MenuIcon fontSize="large" sx={{ color: '#ab0101' }} />
            </IconButton>
            <MenuItems className={showMenu ? 'show' : ''}>
                <MenuItem onClick={() => handleNavigation(user ? '/events/explore' : '/')}>Home</MenuItem>
                {user && (
                    <MenuItem onClick={() => handleNavigation('/home/account')}>My Account</MenuItem>
                )}
                <MenuItem onClick={() => handleNavigation('/faq')}>FAQ</MenuItem>
                <MenuItem onClick={() => handleNavigation('/terms')}>Terms and Conditions</MenuItem>
                {user && (
                    <MenuItem onClick={() => handleNavigation('/home/logout')}>Logout</MenuItem>
                )}
            </MenuItems>
        </Nav>
    );
};

export default Navbar;
