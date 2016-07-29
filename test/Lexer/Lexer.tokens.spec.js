'use strict';

const expect = require('chai').expect;
const Lexer = require('../../src/Lexer');
const {
	textLiteral,
	startTag,
	endTag,
	ifStatement,
	variable,
	string,
	stringSingle,
	stringDouble,
	bracketOpen,
	bracketClose,
	andOperator,
	notOperator,
	integer,
	float
} = require('../tokenBuilders');

describe('Lexer.tokens', function() {
	[
		{
			description: 'with empty string',
			input: [ '' ],
			expected: []
		},
		{
			description: 'with string literal only',
			input: [ 'a' ],
			expected: [
				textLiteral(0, 'a')
			]
		},
		{
			description: 'with tag only',
			input: [ '{{' ],
			expected: [
				startTag(0)
			]
		},
		{
			description: 'with tag after literal',
			input: [ 'aa{{' ],
			expected: [
				textLiteral(0, 'aa'), startTag(2)
			]
		},
		{
			description: 'with if tag',
			input: ['a', '{{if}}'],
			expected: [
				textLiteral(0, 'a\n'),
				startTag(2), ifStatement(4), endTag(6)
			]
		},
		{
			description: 'with whitespace inside tag',
			input: ['a', '{{ if }}'],
			expected: [
				textLiteral(0, 'a\n'),
				startTag(2), ifStatement(5), endTag(8)
			]
		},
		{
			description: 'with variable in if',
			input: ['a', '{{if var}}'],
			expected: [
				textLiteral(0, 'a\n'),
				startTag(2), ifStatement(4), variable(7, 'var'), endTag(10)
			]
		},
		{
			description: 'with single quoted string in if',
			input: [ '{{if \'str\'}}' ],
			expected: [
				startTag(0), ifStatement(2),
				stringSingle(5), string(6, 'str'), stringSingle(9), endTag(10)
			]
		},
		{
			description: 'with double quoted string in if',
			input: [ '{{if "str"}}' ],
			expected: [
				startTag(0), ifStatement(2),
				stringDouble(5), string(6, 'str'), stringDouble(9), endTag(10)
			]
		},
		{
			description: 'with brackets',
			input: [ '{{()}}' ],
			expected: [
				startTag(0), bracketOpen(2), bracketClose(3), endTag(4)
			]
		},
		{
			description: 'with nested brackets',
			input: [ '{{ ( ( ) ) }}' ],
			expected: [
				startTag(0),
				bracketOpen(3), bracketOpen(5), bracketClose(7), bracketClose(9),
				endTag(11)
			]
		},
		{
			description: 'with binary operator',
			input: [ '{{foo&&bar}}' ],
			expected: [
				startTag(0),
				variable(2, 'foo'), andOperator(5), variable(7, 'bar'),
				endTag(10)
			]
		},
		{
			description: 'with unary operator',
			input: [ '{{!foo}}' ],
			expected: [
				startTag(0),
				notOperator(2), variable(3, 'foo'),
				endTag(6)
			]
		},
		{
			description: 'with integer literal',
			input: [ '{{123}}' ],
			expected: [
				startTag(0), integer(2, '123'), endTag(5)
			]
		},
		{
			description: 'with float literal',
			input: [ '{{1.23}}' ],
			expected: [
				startTag(0), float(2, '1.23'), endTag(6)
			]
		},
		{
			description: 'with negative integer literal',
			input: [ '{{-123}}' ],
			expected: [
				startTag(0), integer(2, '-123'), endTag(6)
			]
		},
		{
			description: 'with negative float literal',
			input: [ '{{-1.23}}' ],
			expected: [
				startTag(0), float(2, '-1.23'), endTag(7)
			]
		}
	].forEach((testCase) => {
		it(`should tokenize ${testCase.description}`, function() {
			const lexer = new Lexer(testCase.input.join('\n'));
			const tokens = lexer.tokens();
			const result = [];
			
			for (const value of tokens) {
				if (value.subType !== 'EOF') {
					result.push(value);
				}
			}
			
			expect(result).to.deep.equal(testCase.expected);
		});
	});
	
	it('should error with invalid state', function() {
		const lexer = new Lexer('foo');
		lexer.state = 'INVALID';
		const tokens = lexer.tokens();
		expect(() => tokens.next()).to.throw(/Invalid state incurred/);
	});
});