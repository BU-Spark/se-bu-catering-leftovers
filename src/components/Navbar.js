"use client";

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Link from 'next/link';
import { auth, firestore } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
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
    z-index: 1000;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    @media (max-width: 768px) {
        padding: 15px 30px;
        height: 80px;
    }

    @media (max-width: 480px) {
        padding: 10px 20px;
        height: 60px;
    }
`;

const Logo = styled.div`
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
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
    display: ${({ show }) => (show ? 'block' : 'none')};
    position: absolute;
    left: 0;
    top: 100%;
    width: 100%;
    text-decoration: none;
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
    font-family: 'Arial', sans-serif;
    font-weight: bold;
    &:hover {
        background-color: #d5d2d2;
    }
`;

const Navbar = ({ userRole }) => {
    const [showMenu, setShowMenu] = useState(false);
    const [role, setRole] = useState(userRole);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const fetchUserRole = async () => {
            const user = auth.currentUser;
            if (user) {
                const userDoc = await getDoc(doc(firestore, 'Users', user.uid));
                if (userDoc.exists()) {
                    console.log('User role:', userDoc.data().role);
                    setRole(userDoc.data().role);
                } else {
                    console.log('User document does not exist');
                }
            } else {
                console.log('No authenticated user');
            }
        };

        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                fetchUserRole();
            } else {
                setRole(null);
            }
        });

        return () => unsubscribe();
    }, []);

    const toggleMenu = () => {
        setShowMenu(!showMenu);
    };

    if (!mounted) return null;

    return (
        <Nav>
            <Logo>
                <LogoImage src="/bu-logo.png" alt="Boston University Logo" />
            </Logo>
            <IconButton onClick={toggleMenu}>
                <MenuIcon fontSize="large" sx={{color:"#ab0101"}}/>
            </IconButton>
            <MenuItems show={showMenu}>
                <Link href="/" passHref>
                    <MenuItem as='a'>Home</MenuItem>
                </Link>
                {role && (
                    <Link href={role === 'Administrator' ? "/admin/account" : "/student/account"} passHref>
                        <MenuItem as="a">My Account</MenuItem>
                    </Link>
                )}
                <Link href="/faq" passHref>
                    <MenuItem as='a'>FAQ</MenuItem>
                </Link>
                <Link href="/termsconditions" passHref>
                    <MenuItem as='a'>Terms and Conditions</MenuItem>
                </Link>
                <Link href="/logout" passHref>
                    <MenuItem as='a'>Logout</MenuItem>
                </Link>
            </MenuItems>
        </Nav>
    );
};

export default Navbar;

