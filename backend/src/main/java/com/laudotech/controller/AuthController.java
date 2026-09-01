package com.laudotech.controller;

import com.laudotech.dto.EngenheiroRequest;
import com.laudotech.dto.LoginRequest;
import com.laudotech.dto.LoginResponse;
import com.laudotech.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register")
    public ResponseEntity<LoginResponse> register(@Valid @RequestBody EngenheiroRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }
}
