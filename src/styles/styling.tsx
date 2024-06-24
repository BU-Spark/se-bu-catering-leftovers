import { createTheme, ThemeProvider } from '@mui/material/styles';


// Create a custom theme with primary color
export const theme = createTheme({
    palette: {
      primary: {
        main: "#ab0101", 
      },
      secondary: {
        main: "#2D2926",
      }
    },
    typography: {
      fontFamily: 'Inter',
      fontWeightBold: 600,
      button: {
        textTransform: 'none', // Prevent capitalization for buttons
        fontWeight: 600,
        fontSize: '1rem',
      },
      h4: {
        fontWeight: 600,
        fontSize: '1.1rem',
      },
      // Define other typography variants as needed
      h6: {
        fontWeight: 600,
        fontSize: '0.9rem',
      },
      body1: {
        fontSize: '0.9rem',
      },
      body2: {
        fontSize: '0.875rem',
      },
    },
  });

// Styling for text fields and time pickers
export const props = {
    '& .MuiInputBase-root': {
        color: "secondary", // Set the text color
    },
    '& .MuiFormLabel-root': {
        color: "#505050", // Set the label color
    },
    '& .MuiFormLabel-root.Mui-focused': {
        color: "#505050", // Keep the label color when focused
    },
    '& .MuiOutlinedInput-root': {
        borderRadius: "10px", // Set the input border radius
        '& fieldset': {
        borderColor: "#ab0101", // Set the outline color
        },
        '&:hover fieldset': {
        borderColor: "#ab0101", // Set the outline color on hover
        },
        '&.Mui-focused fieldset': {
        borderColor: "#ab0101", // Set the outline color when focused
        },
      },
}