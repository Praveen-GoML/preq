import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  ThemeProvider,
  createTheme
} from '@mui/material';
import { ArrowRight } from 'lucide-react';

const landingTheme = createTheme({
  palette: {
    primary: {
      main: '#ED7D31',
      light: '#FF954E',
      dark: '#C85A14',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#0F172A',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    button: {
      textTransform: 'none',
      fontWeight: 800,
    },
  },
  shape: {
    borderRadius: 14,
  },
});

export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <ThemeProvider theme={landingTheme}>
      <Box
        component="section"
        sx={{
          width: '100%',
          height: '100vh',
          maxHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FFFFFF',
          px: { xs: 3, sm: 5, md: 7 },
          position: 'relative',
          overflow: 'hidden',
          // Keyframe animations for button sheen, pulse & gradient
          '@keyframes pulseGlow': {
            '0%': {
              boxShadow: '0 8px 26px rgba(237, 125, 49, 0.4), 0 0 0 0 rgba(237, 125, 49, 0.45)',
            },
            '70%': {
              boxShadow: '0 14px 38px rgba(237, 125, 49, 0.55), 0 0 0 16px rgba(237, 125, 49, 0)',
            },
            '100%': {
              boxShadow: '0 8px 26px rgba(237, 125, 49, 0.4), 0 0 0 0 rgba(237, 125, 49, 0)',
            },
          },
          '@keyframes shimmerSheen': {
            '0%': {
              transform: 'translateX(-160%) skewX(-20deg)',
            },
            '40%, 100%': {
              transform: 'translateX(260%) skewX(-20deg)',
            },
          },
          '@keyframes gradientShift': {
            '0%': {
              backgroundPosition: '0% 50%',
            },
            '50%': {
              backgroundPosition: '100% 50%',
            },
            '100%': {
              backgroundPosition: '0% 50%',
            },
          },
        }}
      >
        {/* Top Header: ONLY Official Brand Logo */}
        <Box
          sx={{
            position: 'absolute',
            top: { xs: 20, sm: 28 },
            left: { xs: 24, sm: 40, md: 56 },
            zIndex: 10,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <svg width="112" height="34" viewBox="0 0 117 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M57.4577 20.6304V20.5321H54.6025V20.6216C54.6025 23.0446 52.6117 24.6665 50.049 24.6665C47.4863 24.6665 45.7618 23.0534 45.7618 20.6304C45.7618 18.179 47.4601 16.568 50.049 16.568H50.6362V13.7238H49.99C45.7269 13.7238 42.6403 16.6182 42.6403 20.6304C42.6403 24.8062 45.537 27.4802 50.1035 27.4802C52.6662 27.4802 54.2248 28.5367 54.2248 30.2656C54.2248 32.0184 52.5549 33.1906 50.049 33.1906C47.4317 33.1906 45.7902 31.8525 45.8447 29.8203H42.78C42.6119 33.5224 45.5086 36 50.049 36C54.4758 36 57.3725 33.7734 57.3725 30.2939C57.3725 28.2617 56.1479 26.7293 53.9498 25.9195C56.2331 24.9175 57.4577 23.0817 57.4577 20.6304ZM54.6025 16.568V19.1526H54.6046V16.568H54.6025Z" fill="#111827"/>
              <path d="M54.6069 19.1526V16.568H52.018V13.7238H57.4533V18.5588V19.1526H54.6069Z" fill="#ED7D31"/>
              <path d="M60.2104 20.8791C60.2104 16.7579 63.0787 13.6953 67.5624 13.6953C72.0176 13.6953 74.8859 16.7579 74.8859 20.8791C74.8859 25.0004 72.0176 28.063 67.5624 28.063C63.0787 28.063 60.2104 25.0004 60.2104 20.8791ZM71.7666 20.8791C71.7666 18.4845 70.1229 16.5352 67.5624 16.5352C64.9735 16.5352 63.3298 18.4845 63.3298 20.8791C63.3298 23.2738 64.9735 25.2231 67.5624 25.2231C70.1251 25.2231 71.7666 23.2738 71.7666 20.8791Z" fill="#111827"/>
              <path d="M17.9782 0C8.04827 0 0 8.04825 0 17.9781C0 27.908 8.04827 35.9563 17.9782 35.9563C27.9081 35.9563 35.9564 27.908 35.9564 17.9781C35.9564 8.04825 27.9103 0 17.9782 0ZM20.0235 29.5758H17.2142C10.838 29.5561 5.65365 24.3543 5.65365 17.976C5.65365 11.6413 10.7725 6.46567 17.0898 6.38053V10.6721C13.1366 10.755 9.94083 14.0097 9.94083 17.976C9.94083 21.9466 13.1366 25.1991 17.0898 25.282L18.2489 25.2842L18.286 25.2471L23.2149 20.316L23.4288 20.1064H14.4135V15.8149H23.4288L23.2171 15.6032L18.8382 11.2243L21.8724 8.19014L31.6386 17.9585L20.0235 29.5758Z" fill="#ED7D31"/>
              <path d="M98.4652 8.1377V27.7028H95.2237V13.6713L88.4327 22.2805H87.7342L80.9695 13.6997V27.7028H77.6995V8.1377H80.6617L88.0966 17.6135L95.5314 8.1377H98.4652Z" fill="#111827"/>
              <path d="M102.562 8.1377H105.832V24.6555H116.147V27.7028H102.562V8.1377Z" fill="#111827"/>
            </svg>
            <span style={{
              background: '#FFF7ED',
              color: '#ED7D31',
              border: '1px solid #FFEDD5',
              fontSize: '11px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '9999px',
              letterSpacing: '0.02em',
            }}>
              PreQ
            </span>
          </Box>
        </Box>

        {/* Central Side-by-Side Flex Layout (STRICTLY SIDE-BY-SIDE: NEVER ON BOTTOM) */}
        <Container
          maxWidth="xl"
          sx={{
            width: '100%',
            my: 'auto',
            pt: { xs: 8, sm: 4 },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row', // STRICTLY SIDE-BY-SIDE
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: { xs: 4, sm: 5, md: 6, lg: 8 },
              width: '100%',
            }}
          >
            {/* LEFT COLUMN: Headline, Narrative & Animated Button */}
            <Box
              sx={{
                flex: '1 1 58%',
                maxWidth: { xs: '56%', sm: '58%', md: '60%' },
                textAlign: 'left',
              }}
            >
              {/* Mass Hero Headline */}
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.4rem', sm: '3.1rem', md: '3.8rem', lg: '4.4rem' },
                  fontWeight: 900,
                  color: '#0F172A',
                  letterSpacing: '-0.04em',
                  lineHeight: { xs: 1.12, sm: 1.08, md: 1.05 },
                  mb: 2.5,
                }}
              >
                Never Start an Enterprise Project{' '}
                <Box
                  component="span"
                  sx={{
                    background: 'linear-gradient(135deg, #0F172A 0%, #475569 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Blind.
                </Box>
                <br />
                Turn SOWs into{' '}
                <Box
                  component="span"
                  sx={{
                    background: 'linear-gradient(135deg, #ED7D31 0%, #EA580C 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    display: 'inline-block',
                  }}
                >
                  Day-1 Readiness.
                </Box>
              </Typography>

              {/* Subtitle Narrative */}
              <Typography
                sx={{
                  fontSize: { xs: '15px', sm: '16.5px', md: '18px', lg: '19.5px' },
                  color: '#475569',
                  lineHeight: 1.55,
                  maxWidth: '620px',
                  mb: 4.5,
                  fontWeight: 500,
                }}
              >
                goML PreQ automatically parses statements of work, maps unstated client dependencies,
                validates credentials, and issues cryptographic kickoff clearance before your engineers
                write a single line of code.
              </Typography>

              {/* HIGH-END ANIMATED "GET STARTED" BUTTON */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                <Button
                  id="hero-get-started-btn"
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/new')}
                  endIcon={
                    <Box
                      component="span"
                      className="arrow-box"
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.22)',
                        transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        ml: 0.5,
                      }}
                    >
                      <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.6} />
                    </Box>
                  }
                  sx={{
                    position: 'relative',
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, #ED7D31 0%, #F97316 35%, #EA580C 70%, #ED7D31 100%)',
                    backgroundSize: '250% 250%',
                    animation: 'pulseGlow 2.8s infinite ease-in-out, gradientShift 6s ease infinite',
                    color: '#FFFFFF',
                    fontSize: { xs: '15.5px', sm: '17px' },
                    fontWeight: 800,
                    letterSpacing: '-0.01em',
                    py: { xs: 1.6, sm: 1.9 },
                    px: { xs: 4, sm: 5.2 },
                    borderRadius: '9999px',
                    border: '1.5px solid rgba(255, 255, 255, 0.35)',
                    transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    cursor: 'pointer',
                    zIndex: 1,

                    // Continuous Shimmer Sheen Reflection Effect
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '60%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.38), transparent)',
                      animation: 'shimmerSheen 3.2s infinite ease-in-out',
                      pointerEvents: 'none',
                      zIndex: 2,
                    },

                    // Interactive Hover Micro-Interactions
                    '&:hover': {
                      background: 'linear-gradient(135deg, #FF8A3D 0%, #ED7D31 50%, #EA580C 100%)',
                      transform: 'translateY(-3px) scale(1.025)',
                      boxShadow: '0 16px 42px rgba(237, 125, 49, 0.5)',
                      '& .arrow-box': {
                        transform: 'translateX(5px)',
                        background: 'rgba(255, 255, 255, 0.35)',
                      },
                    },

                    // Click active state
                    '&:active': {
                      transform: 'translateY(-1px) scale(0.99)',
                    },
                  }}
                >
                  Get Started
                </Button>
              </Box>
            </Box>

            {/* RIGHT COLUMN: HERO VIDEO SHOWCASE (STRICTLY ON THE RIGHT SIDE) */}
            <Box
              sx={{
                flex: '0 0 auto',
                width: { xs: '42%', sm: '40%', md: '38%' },
                maxWidth: { xs: '380px', sm: '420px', md: '460px' },
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
              }}
            >
              {/* Soft Ambient Glow Behind Video */}
              <Box
                sx={{
                  position: 'absolute',
                  width: '90%',
                  height: '90%',
                  background: 'radial-gradient(circle, rgba(237, 125, 49, 0.22) 0%, rgba(237, 125, 49, 0) 70%)',
                  filter: 'blur(30px)',
                  zIndex: 0,
                }}
              />

              {/* Luxury Framed Video Card */}
              <Box
                sx={{
                  position: 'relative',
                  zIndex: 1,
                  width: '100%',
                  aspectRatio: '1 / 1',
                  maxHeight: { xs: '360px', sm: '400px', md: '450px' },
                  borderRadius: '28px',
                  overflow: 'hidden',
                  background: '#0F172A',
                  border: '1.5px solid #E2E8F0',
                  boxShadow: '0 24px 60px rgba(15, 23, 42, 0.14)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <video
                  src="/hero_video.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </Box>
            </Box>

          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
};
