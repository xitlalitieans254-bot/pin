package com.whoiszxl.zhipin.tools.common.exception;

import com.whoiszxl.zhipin.tools.common.entity.ResponseResult;
import com.whoiszxl.zhipin.tools.common.exception.custom.ServiceException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.servlet.http.HttpServletRequest;

/**
 * @author whoiszxl
 */
@Slf4j
@ControllerAdvice
public class ExceptionCatchAdvice {
    @ResponseBody
    @ExceptionHandler(Exception.class)
    public ResponseResult<String> catchException(Exception e, HttpServletRequest request) {
        log.error("ExceptionCatchAdvice|发生未知异常|{}", request.getRequestURL(), e);
        return ResponseResult.buildError("系统异常，请稍后再试");
    }

    @ResponseBody
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseResult<String> catchIllegalArgumentException(IllegalArgumentException e, HttpServletRequest request) {
        return ResponseResult.buildError(e.getMessage());
    }

    @ResponseBody
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseResult<String> catchHttpMessageNotReadableException(HttpMessageNotReadableException e, HttpServletRequest request) {
        return ResponseResult.buildError("请求参数格式不正确");
    }

    @ResponseBody
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseResult<String> catchHttpRequestMethodNotSupported(HttpRequestMethodNotSupportedException e, HttpServletRequest request) {
        return ResponseResult.buildError(HttpStatus.METHOD_NOT_ALLOWED.value(), e.getMessage());
    }

    @ResponseBody
    @ExceptionHandler(ServiceException.class)
    public ResponseResult<String> catchServiceException(ServiceException e, HttpServletRequest request) {
        return ResponseResult.buildError(e.getMessage());
    }


    @ResponseBody
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseResult<String> catchMethodArgumentNotValidException(MethodArgumentNotValidException e, HttpServletRequest request) {
        String message = e.getBindingResult().getAllErrors().isEmpty()
                ? "参数校验失败"
                : e.getBindingResult().getAllErrors().get(0).getDefaultMessage();
        return ResponseResult.buildError(message);
    }
}
