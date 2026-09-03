import 'package:flutter/material.dart';

import '../models/app_state.dart';
import '../widgets/cards.dart';
import '../widgets/form_field.dart';
import '../widgets/tap_button.dart';

/// Sign-in screen — ported from the Figma `SignInPage`.
class SignInScreen extends StatefulWidget {
  const SignInScreen({super.key, required this.state});

  final AppState state;

  @override
  State<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends State<SignInScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  String? _emailError;
  String? _passwordError;
  bool _loading = false;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  void _submit() {
    setState(() {
      _emailError = _email.text.trim().isEmpty ? 'Email is required.' : null;
      _passwordError = _password.text.isEmpty ? 'Password is required.' : null;
    });
    if (_emailError != null || _passwordError != null) return;
    setState(() => _loading = true);
    Future.delayed(const Duration(milliseconds: 700), () {
      if (!mounted) return;
      widget.state.signIn(_email.text.split('@').first.isEmpty ? 'Joyce' : _email.text.split('@').first);
      Navigator.of(context).pushNamedAndRemoveUntil('/dashboard', (route) => false);
    });
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      backgroundColor: scheme.surfaceContainerHighest,
      body: SafeArea(
        child: Column(
          children: [
            _AuthHeader(),
            Expanded(
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Container(
                    constraints: const BoxConstraints(maxWidth: 440),
                    padding: const EdgeInsets.all(28),
                    decoration: BoxDecoration(
                      color: scheme.surface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: scheme.outline),
                    ),
                    child: Column(
                      children: [
                        Text(
                          'Welcome back',
                          style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: scheme.onSurface),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Sign in to your CareConnect account.',
                          style: TextStyle(fontSize: 14, color: scheme.onSurfaceVariant),
                        ),
                        const SizedBox(height: 24),
                        CCFormField(
                          label: 'Email address',
                          required: true,
                          error: _emailError,
                          child: CCInput(
                            controller: _email,
                            placeholder: 'you@example.com',
                            keyboardType: TextInputType.emailAddress,
                            error: _emailError != null,
                            onSubmitted: (_) => _submit(),
                          ),
                        ),
                        const SizedBox(height: 18),
                        CCFormField(
                          label: 'Password',
                          required: true,
                          hint: 'Any password works — this is a demonstration app.',
                          error: _passwordError,
                          child: CCInput(
                            controller: _password,
                            obscure: true,
                            error: _passwordError != null,
                            onSubmitted: (_) => _submit(),
                          ),
                        ),
                        const SizedBox(height: 24),
                        TapButton(
                          label: _loading ? 'Signing in…' : '→  Sign in',
                          size: TapButtonSize.lg,
                          fullWidth: true,
                          onPressed: _loading ? null : _submit,
                        ),
                        const SizedBox(height: 18),
                        TextButton(
                          onPressed: () => Navigator.of(context).pushReplacementNamed('/signup'),
                          child: Text.rich(
                            TextSpan(
                              text: "Don't have an account? ",
                              style: TextStyle(color: scheme.onSurfaceVariant, fontSize: 14),
                              children: [
                                TextSpan(
                                  text: 'Sign up for free',
                                  style: TextStyle(
                                    color: scheme.primary,
                                    fontWeight: FontWeight.w600,
                                    decoration: TextDecoration.underline,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Sign-up screen — ported from the Figma `SignUpPage`.
class SignUpScreen extends StatefulWidget {
  const SignUpScreen({super.key, required this.state});

  final AppState state;

  @override
  State<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends State<SignUpScreen> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  String? _nameError;
  String? _emailError;
  String? _passwordError;
  String? _confirmError;
  bool _loading = false;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  void _submit() {
    setState(() {
      _nameError = _name.text.trim().isEmpty ? 'Name is required.' : null;
      _emailError = _email.text.trim().isEmpty ? 'Email is required.' : null;
      _passwordError =
          _password.text.length < 6 ? 'Password must be at least 6 characters.' : null;
      _confirmError =
          _password.text != _confirm.text ? 'Passwords do not match.' : null;
    });
    if (_nameError != null ||
        _emailError != null ||
        _passwordError != null ||
        _confirmError != null) {
      return;
    }
    setState(() => _loading = true);
    Future.delayed(const Duration(milliseconds: 700), () {
      if (!mounted) return;
      widget.state.signIn(_name.text.trim());
      Navigator.of(context).pushNamedAndRemoveUntil('/dashboard', (route) => false);
    });
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      backgroundColor: scheme.surfaceContainerHighest,
      body: SafeArea(
        child: Column(
          children: [
            _AuthHeader(),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Center(
                  child: Container(
                    constraints: const BoxConstraints(maxWidth: 440),
                    padding: const EdgeInsets.all(28),
                    decoration: BoxDecoration(
                      color: scheme.surface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: scheme.outline),
                    ),
                    child: Column(
                      children: [
                        Text(
                          'Create your account',
                          style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: scheme.onSurface),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Free, private, and takes under two minutes.',
                          style: TextStyle(fontSize: 14, color: scheme.onSurfaceVariant),
                        ),
                        const SizedBox(height: 24),
                        CCFormField(
                          label: 'Your name',
                          required: true,
                          hint: 'This is how CareConnect will greet you.',
                          error: _nameError,
                          child: CCInput(controller: _name, placeholder: 'e.g. Dorothy Smith', error: _nameError != null),
                        ),
                        const SizedBox(height: 18),
                        CCFormField(
                          label: 'Email address',
                          required: true,
                          error: _emailError,
                          child: CCInput(
                            controller: _email,
                            placeholder: 'you@example.com',
                            keyboardType: TextInputType.emailAddress,
                            error: _emailError != null,
                          ),
                        ),
                        const SizedBox(height: 18),
                        CCFormField(
                          label: 'Password',
                          required: true,
                          hint: 'At least 6 characters.',
                          error: _passwordError,
                          child: CCInput(controller: _password, obscure: true, error: _passwordError != null),
                        ),
                        const SizedBox(height: 18),
                        CCFormField(
                          label: 'Confirm password',
                          required: true,
                          error: _confirmError,
                          child: CCInput(controller: _confirm, obscure: true, error: _confirmError != null),
                        ),
                        const SizedBox(height: 24),
                        TapButton(
                          label: _loading ? 'Creating…' : '→  Create account',
                          size: TapButtonSize.lg,
                          fullWidth: true,
                          onPressed: _loading ? null : _submit,
                        ),
                        const SizedBox(height: 18),
                        TextButton(
                          onPressed: () => Navigator.of(context).pushReplacementNamed('/signin'),
                          child: Text.rich(
                            TextSpan(
                              text: 'Already have an account? ',
                              style: TextStyle(color: scheme.onSurfaceVariant, fontSize: 14),
                              children: [
                                TextSpan(
                                  text: 'Sign in',
                                  style: TextStyle(
                                    color: scheme.primary,
                                    fontWeight: FontWeight.w600,
                                    decoration: TextDecoration.underline,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Shared auth header: logo + wordmark.
class _AuthHeader extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Material(
      color: scheme.surface,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
        child: Row(
          children: [
            const CCLogo(size: 32),
            const SizedBox(width: 8),
            Text.rich(
              TextSpan(
                style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
                children: [
                  TextSpan(text: 'Care', style: TextStyle(color: scheme.primary)),
                  TextSpan(text: 'Connect', style: TextStyle(color: scheme.onSurface)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
