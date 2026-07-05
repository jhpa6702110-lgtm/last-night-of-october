import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { LogIn, UserPlus, AlertCircle, CheckCircle, Mail, Lock, User, Phone, Calendar } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!supabase) {
      setErrorMsg('Supabase 설정이 완료되지 않았습니다. 관리자 설정을 확인해주세요.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      setSuccessMsg('로그인 성공!');
      triggerConfetti();
      setTimeout(() => {
        onAuthSuccess(data.session);
      }, 1000);
    } catch (err) {
      setErrorMsg(err.message || '로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!supabase) {
      setErrorMsg('Supabase 설정이 완료되지 않았습니다. 관리자 설정을 확인해주세요.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // 1. Check if the name and phone match a pre-registered alumni profile
      const cleanPhone = phone.replace(/[^0-9]/g, ''); // Extract numbers only
      
      // Query database
      const { data: alumniProfiles, error: queryError } = await supabase
        .from('alumni')
        .select('*');

      if (queryError) throw queryError;

      // Find a matching pre-registered profile
      const matchedProfile = alumniProfiles.find(profile => {
        const dbPhoneClean = (profile.phone || '').replace(/[^0-9]/g, '');
        return profile.name.trim() === name.trim() && dbPhoneClean === cleanPhone;
      });

      if (matchedProfile && matchedProfile.auth_id) {
        throw new Error('이미 이 이름과 연락처로 가입된 계정이 있습니다. 로그인을 시도해 주세요.');
      }

      // 2. Proceed with Supabase Auth SignUp
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone: cleanPhone,
          }
        }
      });

      if (signUpError) throw signUpError;

      const user = signUpData.user;
      if (!user) throw new Error('가입 처리 중 오류가 발생했습니다.');

      // 3. Link or Create the alumni record
      if (matchedProfile) {
        // Link existing
        const { error: updateError } = await supabase
          .from('alumni')
          .update({ 
            auth_id: user.id,
            ...(birthday && !matchedProfile.birthday ? { birthday } : {})
          })
          .eq('id', matchedProfile.id);

        if (updateError) throw updateError;
      } else {
        // Create new profile record
        const { error: insertError } = await supabase
          .from('alumni')
          .insert({
            auth_id: user.id,
            name: name.trim(),
            phone: phone.trim(),
            birthday: birthday || null,
            description: '반갑습니다! 새로 가입한 친구입니다.',
            is_president: false,
            is_treasurer: false
          });

        if (insertError) throw insertError;
      }

      setSuccessMsg('회원가입 완료! 자동으로 로그인 중입니다...');
      triggerConfetti();

      // Automatically sign in the user
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      setTimeout(() => {
        onAuthSuccess(signInData.session);
      }, 1500);

    } catch (err) {
      setErrorMsg(err.message || '회원가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 120px)',
      padding: '20px 0'
    }}>
      <div className="glass fade-in" style={{
        width: '100%',
        maxWidth: '480px',
        padding: '40px 30px',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '35px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 15px auto',
            boxShadow: 'var(--shadow-neon)'
          }}>
            {isLogin ? <LogIn size={28} color="#070b19" /> : <UserPlus size={28} color="#070b19" />}
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: '700', marginBottom: '8px' }}>
            {isLogin ? '친구들의 공간 로그인' : '새로운 친구 등록 (가입)'}
          </h2>
          <p style={{ color: 'var(--color-secondary)', fontSize: '14px' }}>
            {isLogin 
              ? '시월의 마지막 밤에 오신 것을 환영합니다!' 
              : '회장단이 등록한 이름과 휴대폰 번호로 가입할 수 있습니다.'}
          </p>
        </div>

        {/* Success/Error Alerts */}
        {errorMsg && (
          <div className="alert alert-error" style={{ display: 'flex', alignItems: 'flex-start' }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="alert alert-success">
            <CheckCircle size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={isLogin ? handleLogin : handleSignup}>
          
          {!isLogin && (
            <>
              <div className="input-group">
                <label className="input-label">이름 (실명)</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} color="var(--color-secondary)" style={{ position: 'absolute', left: '14px', top: '13px' }} />
                  <input
                    type="text"
                    required
                    placeholder="홍길동"
                    className="input-field"
                    style={{ paddingLeft: '44px' }}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">휴대폰 번호</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={18} color="var(--color-secondary)" style={{ position: 'absolute', left: '14px', top: '13px' }} />
                  <input
                    type="tel"
                    required
                    placeholder="010-1234-5678"
                    className="input-field"
                    style={{ paddingLeft: '44px' }}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">생년월일 (선택)</label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={18} color="var(--color-secondary)" style={{ position: 'absolute', left: '14px', top: '13px' }} />
                  <input
                    type="date"
                    className="input-field"
                    style={{ paddingLeft: '44px' }}
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          <div className="input-group">
            <label className="input-label">이메일 주소</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="var(--color-secondary)" style={{ position: 'absolute', left: '14px', top: '13px' }} />
              <input
                type="email"
                required
                placeholder="example@email.com"
                className="input-field"
                style={{ paddingLeft: '44px' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">비밀번호</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="var(--color-secondary)" style={{ position: 'absolute', left: '14px', top: '13px' }} />
              <input
                type="password"
                required
                placeholder="••••••••"
                className="input-field"
                style={{ paddingLeft: '44px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '10px', height: '48px' }}
          >
            {loading ? '처리 중...' : isLogin ? '로그인하기' : '가입하기'}
          </button>
        </form>

        {/* Footer Toggle */}
        <div style={{ textAlign: 'center', marginTop: '25px', fontSize: '14px', color: 'var(--color-secondary)' }}>
          {isLogin ? (
            <p>
              아직 가입하지 않으셨나요?{' '}
              <span
                onClick={() => {
                  setIsLogin(false);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                style={{ color: 'var(--accent-cyan)', cursor: 'pointer', fontWeight: '600' }}
              >
                회원가입
              </span>
            </p>
          ) : (
            <p>
              이미 계정이 있으신가요?{' '}
              <span
                onClick={() => {
                  setIsLogin(true);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                style={{ color: 'var(--accent-cyan)', cursor: 'pointer', fontWeight: '600' }}
              >
                로그인
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
