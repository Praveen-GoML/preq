import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Chip,
  Stack,
  Grid,
  ThemeProvider,
  createTheme
} from '@mui/material';
import {
  ArrowRight,
  Upload,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  ChevronDown,
  Activity,
  FileText,
  Lock,
  Zap
} from 'lucide-react';

const muiTheme = createTheme({
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
      default: '#F8FAFC',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    button: {
      textTransform: 'none',
      fontWeight: 700,
    },
  },
  shape: {
    borderRadius: 14,
  },
});

export const HeroSection = ({ totalProjects = 0, averageScore = 0, onScrollToPortfolio }) => {
  const navigate = useNavigate();

  return (
    <ThemeProvider theme={muiTheme}>
      <Box
        component="section"
        sx={{
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
          borderBottom: '1px solid #E2E8F0',
          pt: { xs: 5, md: 8 },
          pb: { xs: 6, md: 9 },
        }}
      >
        {/* Ambient Glows */}
        <Box
          sx={{
            position: 'absolute',
            top: '-80px',
            right: '-60px',
            width: '480px',
            height: '480px',
            background: 'radial-gradient(circle, rgba(237, 125, 49, 0.14) 0%, rgba(237, 125, 49, 0) 70%)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '40px',
            left: '-100px',
            width: '420px',
            height: '420px',
            background: 'radial-gradient(circle, rgba(15, 23, 42, 0.05) 0%, rgba(15, 23, 42, 0) 70%)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={{ xs: 4, lg: 6 }} alignItems="center">
            {/* Left Column: Headline, Value Proposition, Action CTAs */}
            <Grid item xs={12} lg={7}>
              {/* Live Badge Pill */}
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
                <Chip
                  icon={<Sparkles size={14} color="#ED7D31" />}
                  label="PREQ 2.0 • AI-POWERED PROJECT READINESS"
                  size="small"
                  sx={{
                    background: '#FFF7ED',
                    color: '#C2410C',
                    border: '1px solid #FFEDD5',
                    fontWeight: 800,
                    fontSize: '11.5px',
                    letterSpacing: '0.04em',
                    px: 0.5,
                  }}
                />
                <Chip
                  icon={<Zap size={13} color="#16A34A" />}
                  label="100% Day-1 Kickoff Assurance"
                  size="small"
                  sx={{
                    background: '#F0FDF4',
                    color: '#15803D',
                    border: '1px solid #BBF7D0',
                    fontWeight: 700,
                    fontSize: '11.5px',
                  }}
                />
              </Stack>

              {/* Mass Headline */}
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.5rem', sm: '3.2rem', md: '3.8rem' },
                  fontWeight: 900,
                  color: '#0F172A',
                  letterSpacing: '-0.04em',
                  lineHeight: { xs: 1.15, sm: 1.12 },
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

              {/* Sub-headline Narrative */}
              <Typography
                sx={{
                  fontSize: { xs: '15.5px', sm: '17px' },
                  color: '#475569',
                  lineHeight: 1.65,
                  maxWidth: '640px',
                  mb: 4,
                  fontWeight: 500,
                }}
              >
                goML PreQ automatically parses statements of work, maps unstated client dependencies,
                validates credentials, and issues cryptographic kickoff clearance before your engineers
                write a single line of code.
              </Typography>

              {/* Primary Call-To-Action Buttons */}
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{ mb: 4.5, alignItems: { xs: 'stretch', sm: 'center' } }}
              >
                {/* GET STARTED BUTTON */}
                <Button
                  id="hero-get-started-btn"
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/new')}
                  endIcon={<ArrowRight size={18} />}
                  sx={{
                    background: 'linear-gradient(135deg, #ED7D31 0%, #EA580C 100%)',
                    color: '#FFFFFF',
                    fontSize: '15px',
                    fontWeight: 800,
                    py: 1.6,
                    px: 3.5,
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(237, 125, 49, 0.35)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #FF8A3D 0%, #ED7D31 100%)',
                      boxShadow: '0 12px 30px rgba(237, 125, 49, 0.45)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  Get Started
                </Button>

                {/* SOW UPLOAD BUTTON */}
                <Button
                  id="hero-upload-sow-btn"
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/new?tab=sow')}
                  startIcon={<Upload size={17} color="#0F172A" />}
                  sx={{
                    borderColor: '#CBD5E1',
                    color: '#0F172A',
                    fontSize: '14.5px',
                    fontWeight: 700,
                    py: 1.6,
                    px: 3,
                    borderRadius: '12px',
                    background: '#FFFFFF',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                    '&:hover': {
                      borderColor: '#ED7D31',
                      color: '#ED7D31',
                      background: '#FFF7ED',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  Upload SOW / Proposal
                </Button>

                {/* SCROLL TO PORTFOLIO */}
                {onScrollToPortfolio && (
                  <Button
                    variant="text"
                    size="large"
                    onClick={onScrollToPortfolio}
                    endIcon={<ChevronDown size={16} />}
                    sx={{
                      color: '#64748B',
                      fontSize: '14px',
                      fontWeight: 600,
                      px: 2,
                      '&:hover': { color: '#0F172A', background: 'transparent' },
                    }}
                  >
                    View Portfolio ({totalProjects})
                  </Button>
                )}
              </Stack>

              {/* Trust Indicators & Key Features */}
              <Stack direction="row" spacing={3} alignItems="center" sx={{ flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ShieldCheck size={18} color="#16A34A" />
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>
                    Zero Surprise Delays
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FileText size={18} color="#ED7D31" />
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>
                    Auto-Generated BRD
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Lock size={18} color="#6366F1" />
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>
                    SHA-256 Launch Certificates
                  </Typography>
                </Box>
              </Stack>
            </Grid>

            {/* Right Column: Visual Product Showcase / Interactive Hero Card */}
            <Grid item xs={12} lg={5}>
              <Paper
                elevation={6}
                sx={{
                  borderRadius: '20px',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 24px 60px rgba(15, 23, 42, 0.1)',
                  p: { xs: 2.5, sm: 3.5 },
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Header Bar */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box
                      sx={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: '#FFF7ED',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ED7D31',
                        border: '1px solid #FFEDD5',
                      }}
                    >
                      <Activity size={20} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
                        MovilVentas Enterprise SOW
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                        Live SOW Intake & Readiness Audit
                      </Typography>
                    </Box>
                  </Stack>
                  <Chip
                    icon={<CheckCircle2 size={13} color="#16A34A" />}
                    label="94% READY"
                    size="small"
                    sx={{
                      background: '#F0FDF4',
                      color: '#15803D',
                      fontWeight: 800,
                      border: '1px solid #BBF7D0',
                      fontSize: '11px',
                    }}
                  />
                </Stack>

                {/* Readiness Metrics Strip */}
                <Box
                  sx={{
                    background: '#F8FAFC',
                    borderRadius: '12px',
                    p: 2,
                    mb: 2.5,
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <Grid container spacing={2} textAlign="center">
                    <Grid item xs={4}>
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block' }}>
                        Readiness
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 900, color: '#10B981', lineHeight: 1.2 }}>
                        94%
                      </Typography>
                    </Grid>
                    <Grid item xs={4} sx={{ borderLeft: '1px solid #E2E8F0', borderRight: '1px solid #E2E8F0' }}>
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block' }}>
                        Prerequisites
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 900, color: '#0F172A', lineHeight: 1.2 }}>
                        12 / 12
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block' }}>
                        Blockers
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 900, color: '#16A34A', lineHeight: 1.2 }}>
                        0 Left
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                {/* Live Extracted Checklist Items */}
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', letterSpacing: '0.05em', textTransform: 'uppercase', mb: 1.5, display: 'block' }}>
                  Extracted Prerequisites & Proof Verification
                </Typography>

                <Stack spacing={1.5} sx={{ mb: 3 }}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#FFFFFF',
                      borderColor: '#E2E8F0',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                      <CheckCircle2 size={17} color="#16A34A" />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
                          MySQL Amazon RDS Replica Access
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                          Evidence Verified • DBA Signoff
                        </Typography>
                      </Box>
                    </Box>
                    <Chip label="VERIFIED" size="small" sx={{ background: '#F0FDF4', color: '#15803D', fontWeight: 800, fontSize: '10px', height: '22px' }} />
                  </Paper>

                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#FFFFFF',
                      borderColor: '#E2E8F0',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                      <CheckCircle2 size={17} color="#16A34A" />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
                          Google Maps API Key & Geocoding Quota
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                          Matrix API Active • Quota Verified
                        </Typography>
                      </Box>
                    </Box>
                    <Chip label="VERIFIED" size="small" sx={{ background: '#F0FDF4', color: '#15803D', fontWeight: 800, fontSize: '10px', height: '22px' }} />
                  </Paper>

                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#FFFFFF',
                      borderColor: '#E2E8F0',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                      <Clock size={17} color="#EA580C" />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
                          AWS Bedrock Claude 3.5 Quota Grant
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                          Client DevOps • Pending AWS Approval
                        </Typography>
                      </Box>
                    </Box>
                    <Chip label="CLEARING" size="small" sx={{ background: '#FFF7ED', color: '#EA580C', fontWeight: 800, fontSize: '10px', height: '22px' }} />
                  </Paper>
                </Stack>

                {/* Footer Certificate Badge */}
                <Box
                  sx={{
                    background: '#0F172A',
                    borderRadius: '12px',
                    p: 1.75,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: '#FFFFFF',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <ShieldCheck size={20} color="#10B981" />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                        Day-1 Kick-off Clearance
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                        Cryptographic Gatekeeper SLA
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    size="small"
                    onClick={() => navigate('/new')}
                    sx={{
                      color: '#ED7D31',
                      fontWeight: 800,
                      fontSize: '12px',
                      background: 'rgba(237, 125, 49, 0.15)',
                      px: 1.5,
                      borderRadius: '8px',
                      '&:hover': { background: 'rgba(237, 125, 49, 0.25)' },
                    }}
                  >
                    Create Initiative &rarr;
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  );
};
